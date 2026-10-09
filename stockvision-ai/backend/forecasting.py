import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Any, List
from sklearn.neural_network import MLPRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import MinMaxScaler, StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, mean_absolute_percentage_error, r2_score

AVAILABLE_MODELS = {
    "MLP": {
        "name": "Multi-Layer Perceptron (MLPRegressor)",
        "type": "Feedforward Artificial Neural Network",
        "description": "Non-linear neural network with hidden layers (64, 32), ReLU activation, Adam optimizer, and early stopping. Learns complex non-linear temporal patterns.",
        "limitations": "Does not maintain internal recurrent cell state like LSTM; relies on fixed-length sliding input window features."
    },
    "LinearRegression": {
        "name": "Linear Regression",
        "type": "Parametric Linear Model",
        "description": "Ordinary Least Squares regressor fitting linear combinations of past lag prices.",
        "limitations": "Assumes linear relationships; prone to underfitting during non-linear regime shifts or high volatility."
    },
    "Ridge": {
        "name": "Ridge Regression (L2 Regularized)",
        "type": "Regularized Linear Model",
        "description": "L2 penalized linear regressor mitigating multicollinearity among consecutive lag prices.",
        "limitations": "Linear boundary constraint; may over-smooth volatile price spikes."
    },
    "RandomForest": {
        "name": "Random Forest Regressor",
        "type": "Ensemble Decision Trees",
        "description": "Ensemble of 100 bagged regression trees capturing non-linear threshold dynamics.",
        "limitations": "Cannot extrapolate trends beyond the minimum and maximum historical training price boundaries."
    },
    "SMA_Baseline": {
        "name": "Simple Moving Average (Baseline)",
        "type": "Statistical Baseline",
        "description": "Forecasts the arithmetic mean of the lookback window observations.",
        "limitations": "Lags behind strong trends; non-adaptive to sudden market inflections."
    }
}

def create_sliding_windows(series: np.ndarray, lookback: int):
    """
    Constructs X (samples, lookback) and y (samples,) from 1D series.
    Strictly chronological without future leakage.
    """
    X, y = [], []
    for i in range(len(series) - lookback):
        X.append(series[i : i + lookback])
        y.append(series[i + lookback])
    return np.array(X), np.array(y)

def generate_future_trading_dates(last_date_str: str, horizon: int) -> List[str]:
    """Generates future dates skipping weekends (Saturdays and Sundays)."""
    current_date = datetime.strptime(last_date_str, "%Y-%m-%d")
    future_dates = []
    while len(future_dates) < horizon:
        current_date += timedelta(days=1)
        if current_date.weekday() < 5:  # Monday to Friday
            future_dates.append(current_date.strftime("%Y-%m-%d"))
    return future_dates

def train_and_forecast(
    records: List[Dict[str, Any]],
    model_type: str = "MLP",
    lookback_window: int = 30,
    forecast_horizon: int = 5,
    target_column: str = "Close",
    train_split_ratio: float = 0.8,
    scaler_type: str = "minmax"
) -> Dict[str, Any]:
    """
    Full chronological ML forecasting pipeline:
    1. Validation
    2. Chronological sequence creation
    3. Scaler fitted ONLY on train set
    4. Model fitting
    5. Test set prediction & metric computation
    6. Multi-step recursive future horizon forecasting
    7. Baseline comparison (Naive t-1 & SMA)
    """
    if not records or len(records) < (lookback_window + 20):
        return {
            "success": False,
            "error": f"Insufficient observations ({len(records) if records else 0}). At least {lookback_window + 20} records required for lookback of {lookback_window}."
        }
        
    df = pd.DataFrame(records)
    df["Date"] = pd.to_datetime(df["Date"]).dt.strftime("%Y-%m-%d")
    df = df.sort_values(by="Date").reset_index(drop=True)
    
    if target_column not in df.columns:
        target_column = "Close"
        
    prices = df[target_column].astype(float).values
    dates = df["Date"].values
    
    # 1. Total window count
    total_samples = len(prices)
    split_idx = int(total_samples * train_split_ratio)
    
    if split_idx <= lookback_window or (total_samples - split_idx) < 5:
        return {
            "success": False,
            "error": "Dataset too small for the selected train/test split ratio and lookback window."
        }
        
    train_prices = prices[:split_idx]
    test_prices = prices[split_idx:]
    
    # 2. Fit Scaler ONLY on Training Data (prevents data leakage)
    if scaler_type == "standard":
        scaler = StandardScaler()
    else:
        scaler = MinMaxScaler(feature_range=(0, 1))
        
    train_scaled = scaler.fit_transform(train_prices.reshape(-1, 1)).flatten()
    # Transform test data using training parameters
    test_scaled = scaler.transform(test_prices.reshape(-1, 1)).flatten()
    all_scaled = np.concatenate([train_scaled, test_scaled])
    
    # 3. Sliding windows
    X_all, y_all = create_sliding_windows(all_scaled, lookback_window)
    
    # Adjust train and test indices for sliding windows
    # Window index corresponding to end of training
    n_train_windows = split_idx - lookback_window
    X_train, y_train = X_all[:n_train_windows], y_all[:n_train_windows]
    X_test, y_test = X_all[n_train_windows:], y_all[n_train_windows:]
    
    test_dates = dates[lookback_window + n_train_windows:]
    y_test_actual = prices[lookback_window + n_train_windows:]
    
    # 4. Instantiate and Train Selected Model
    model_key = model_type if model_type in AVAILABLE_MODELS else "MLP"
    model_meta = AVAILABLE_MODELS[model_key]
    
    if model_key == "MLP":
        model = MLPRegressor(
            hidden_layer_sizes=(64, 32),
            activation="relu",
            solver="adam",
            max_iter=350,
            random_state=42,
            early_stopping=True,
            validation_fraction=0.15,
            n_iter_no_change=15
        )
        model.fit(X_train, y_train)
        y_test_pred_scaled = model.predict(X_test)
    elif model_key == "LinearRegression":
        model = LinearRegression()
        model.fit(X_train, y_train)
        y_test_pred_scaled = model.predict(X_test)
    elif model_key == "Ridge":
        model = Ridge(alpha=1.0)
        model.fit(X_train, y_train)
        y_test_pred_scaled = model.predict(X_test)
    elif model_key == "RandomForest":
        model = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)
        model.fit(X_train, y_train)
        y_test_pred_scaled = model.predict(X_test)
    else: # SMA_Baseline
        model = None
        y_test_pred_scaled = np.mean(X_test, axis=1)
        
    # Invert scaling to real price units ($/₹)
    y_test_pred = scaler.inverse_transform(y_test_pred_scaled.reshape(-1, 1)).flatten()
    
    # Naive baseline (yesterday's price: last item in each input window)
    naive_pred_scaled = X_test[:, -1]
    naive_pred = scaler.inverse_transform(naive_pred_scaled.reshape(-1, 1)).flatten()
    
    # SMA baseline (mean of window in real price units)
    sma_pred_scaled = np.mean(X_test, axis=1)
    sma_pred = scaler.inverse_transform(sma_pred_scaled.reshape(-1, 1)).flatten()
    
    # 5. Model Evaluation Metrics
    mae = float(mean_absolute_error(y_test_actual, y_test_pred))
    rmse = float(np.sqrt(mean_squared_error(y_test_actual, y_test_pred)))
    
    # Avoid zero division in MAPE
    non_zero = y_test_actual > 1e-4
    if np.any(non_zero):
        mape = float(mean_absolute_percentage_error(y_test_actual[non_zero], y_test_pred[non_zero]) * 100)
    else:
        mape = 0.0
        
    r2 = float(r2_score(y_test_actual, y_test_pred))
    
    # Baseline metrics
    naive_mae = float(mean_absolute_error(y_test_actual, naive_pred))
    naive_rmse = float(np.sqrt(mean_squared_error(y_test_actual, naive_pred)))
    sma_mae = float(mean_absolute_error(y_test_actual, sma_pred))
    sma_rmse = float(np.sqrt(mean_squared_error(y_test_actual, sma_pred)))
    
    # Directional accuracy (Hit Rate): whether model correctly predicts sign of change (up or down)
    actual_direction = np.sign(y_test_actual[1:] - y_test_actual[:-1])
    pred_direction = np.sign(y_test_pred[1:] - y_test_actual[:-1])
    directional_accuracy = float(np.mean(actual_direction == pred_direction) * 100) if len(actual_direction) > 0 else 50.0
    
    # 6. Recursive Future Horizon Forecasting
    future_predictions = []
    future_dates = generate_future_trading_dates(str(dates[-1]), forecast_horizon)
    
    # Start with the latest known lookback window
    current_window = all_scaled[-lookback_window:].copy()
    
    for step in range(forecast_horizon):
        if model_key == "SMA_Baseline":
            next_scaled = np.mean(current_window)
        else:
            next_scaled = float(model.predict(current_window.reshape(1, -1))[0])
            
        next_real = float(scaler.inverse_transform([[next_scaled]])[0][0])
        future_predictions.append({
            "horizon_step": step + 1,
            "date": future_dates[step],
            "predicted_price": round(next_real, 2)
        })
        # Slide window forward for next step
        current_window = np.append(current_window[1:], next_scaled)
        
    # Format actual vs predicted test chart series
    test_results_chart = []
    residuals = []
    for d, act, pred in zip(test_dates, y_test_actual, y_test_pred):
        res = round(float(act - pred), 2)
        residuals.append({"date": str(d), "residual": res})
        test_results_chart.append({
            "date": str(d),
            "actual": round(float(act), 2),
            "predicted": round(float(pred), 2),
            "residual": res
        })
        
    return {
        "success": True,
        "model_info": model_meta,
        "config": {
            "model_type": model_key,
            "lookback_window": lookback_window,
            "forecast_horizon": forecast_horizon,
            "target_column": target_column,
            "train_size": len(X_train),
            "test_size": len(X_test),
            "train_start_date": str(dates[0]),
            "train_end_date": str(dates[split_idx - 1]),
            "test_start_date": str(test_dates[0]),
            "test_end_date": str(test_dates[-1]),
            "scaler_type": scaler_type
        },
        "metrics": {
            "mae": round(mae, 3),
            "rmse": round(rmse, 3),
            "mape": round(mape, 2),
            "r2_score": round(r2, 4),
            "directional_accuracy_pct": round(directional_accuracy, 2)
        },
        "baselines": {
            "naive": {
                "name": "Naïve (t-1 Previous Close)",
                "mae": round(naive_mae, 3),
                "rmse": round(naive_rmse, 3)
            },
            "sma": {
                "name": f"SMA (Window {lookback_window})",
                "mae": round(sma_mae, 3),
                "rmse": round(sma_rmse, 3)
            }
        },
        "test_predictions": test_results_chart,
        "future_forecast": future_predictions,
        "residuals": residuals,
        "disclaimer": "DISCLAIMER: Machine learning stock forecasts are statistical estimates based on historical patterns. Past performance does not guarantee future results. This platform does not provide investment advice."
    }
