import numpy as np
import pandas as pd
from typing import Dict, Any, List
from sklearn.metrics import mean_absolute_error, mean_squared_error, mean_absolute_percentage_error, r2_score

def evaluate_model_performance(
    test_actual: List[float],
    test_predicted: List[float],
    dates: List[str] = None
) -> Dict[str, Any]:
    y_true = np.array(test_actual, dtype=float)
    y_pred = np.array(test_predicted, dtype=float)
    
    if len(y_true) < 3 or len(y_pred) < 3:
        return {"success": False, "error": "Insufficient evaluation points."}
        
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    
    non_zero = y_true > 1e-4
    mape = float(mean_absolute_percentage_error(y_true[non_zero], y_pred[non_zero]) * 100) if np.any(non_zero) else 0.0
    r2 = float(r2_score(y_true, y_pred))
    
    residuals = y_true - y_pred
    mean_res = float(np.mean(residuals))
    std_res = float(np.std(residuals))
    max_err = float(np.max(np.abs(residuals)))
    
    # Directional correctness
    act_diff = y_true[1:] - y_true[:-1]
    pred_diff = y_pred[1:] - y_true[:-1]
    dir_acc = float(np.mean(np.sign(act_diff) == np.sign(pred_diff)) * 100) if len(act_diff) > 0 else 50.0
    
    # Naive baseline (y_true shifted by 1)
    naive_pred = np.roll(y_true, 1)
    naive_pred[0] = y_true[0]
    naive_mae = float(mean_absolute_error(y_true[1:], naive_pred[1:]))
    naive_rmse = float(np.sqrt(mean_squared_error(y_true[1:], naive_pred[1:])))
    
    residual_series = []
    if dates and len(dates) == len(y_true):
        for d, a, p, r in zip(dates, y_true, y_pred, residuals):
            residual_series.append({
                "date": str(d),
                "actual": round(float(a), 2),
                "predicted": round(float(p), 2),
                "residual": round(float(r), 2)
            })
            
    return {
        "success": True,
        "metrics": {
            "mae": round(mae, 3),
            "rmse": round(rmse, 3),
            "mape": round(mape, 2),
            "r2_score": round(r2, 4),
            "directional_accuracy_pct": round(dir_acc, 2),
            "mean_residual": round(mean_res, 3),
            "std_residual": round(std_res, 3),
            "max_error": round(max_err, 2)
        },
        "baseline_comparison": {
            "model_mae": round(mae, 3),
            "model_rmse": round(rmse, 3),
            "naive_mae": round(naive_mae, 3),
            "naive_rmse": round(naive_rmse, 3),
            "improvement_over_naive_mae_pct": round(((naive_mae - mae) / naive_mae) * 100, 2) if naive_mae > 0 else 0.0
        },
        "residual_series": residual_series,
        "academic_insights": [
            {
                "title": "Forecasting Accuracy vs. Trading Profitability",
                "explanation": "A machine learning model can attain high R² and low MAE by closely tracking historical levels, yet still generate losing trades if it fails to predict turning points or if slippage and fees erode margins."
            },
            {
                "title": "Strict Data Leakage Prevention",
                "explanation": "Chronological train/test sequence separation and fitting normalizers solely on training windows ensures the test set evaluates genuine out-of-sample generalization without future information leak."
            },
            {
                "title": "Naïve Baseline Benchmark",
                "explanation": "In efficient markets, yesterday's price is often a strong one-step forecast. Comparing against the naïve baseline (t-1) validates whether the neural network learned real temporal predictive signal."
            }
        ]
    }
