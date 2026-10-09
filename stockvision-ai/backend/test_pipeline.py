import requests
import json
from data_service import load_stock_data
from preprocessing import run_preprocessing_pipeline
from forecasting import train_and_forecast
from backtesting import run_backtest_strategy
from evaluation import evaluate_model_performance
from reports import generate_csv_export, generate_html_summary_report

print("Testing end-to-end pipeline:")

# 1. Load data
res_data = load_stock_data("AAPL", force_sample=True)
assert res_data["success"] == True
records = res_data["data"]
print(f"1. Data loaded: {len(records)} records. Latest price: {res_data['metrics']['latest_price']}")

# 2. Preprocess data
res_prep = run_preprocessing_pipeline(records, missing_policy="forward_fill", lookback_window=30)
assert res_prep["success"] == True
print(f"2. Preprocessing passed: {len(res_prep['pipeline_steps'])} steps verified.")

# 3. Forecast
res_fc = train_and_forecast(records, model_type="MLP", lookback_window=30, forecast_horizon=5)
assert res_fc["success"] == True
print(f"3. Forecasting passed: MAE={res_fc['metrics']['mae']}, RMSE={res_fc['metrics']['rmse']}, Future steps={len(res_fc['future_forecast'])}")

# 4. Backtesting
res_bt = run_backtest_strategy(records, short_window=10, long_window=30, initial_capital=10000)
assert res_bt["success"] == True
print(f"4. Backtesting passed: Strategy return={res_bt['metrics']['total_strategy_return_pct']}%, Trades={res_bt['metrics']['total_trades']}")

# 5. Reports
csv_out = generate_csv_export("trades", {"trade_log": res_bt["trade_log"]})
assert len(csv_out) > 20
html_out = generate_html_summary_report({
    "ticker": "AAPL",
    "company_name": "Apple Inc.",
    "data_source": "Sample Data",
    "model_name": "MLPRegressor",
    "model_metrics": res_fc["metrics"],
    "backtest_metrics": res_bt["metrics"],
    "strategy_config": res_bt["strategy"]
})
assert "StockVision AI" in html_out
print("5. Reports and exports generated successfully!")

print("\nALL BACKEND CORE PIPELINES FUNCTIONING PERFECTLY!")
