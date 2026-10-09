import urllib.request
import urllib.parse
import json
import io

BASE_URL = "http://127.0.0.1:8000/api"

def make_request(url, data=None, headers=None, method="GET"):
    if headers is None:
        headers = {}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        return resp.getcode(), resp.read()

print("1. Testing GET /api/health...")
code, body = make_request(f"{BASE_URL}/health")
assert code == 200
print("   Passed! Response:", json.loads(body)["status"])

print("2. Testing GET /api/tickers...")
code, body = make_request(f"{BASE_URL}/tickers")
assert code == 200
tickers = json.loads(body)
assert len(tickers) >= 5
print(f"   Passed! {len(tickers)} tickers listed.")

print("3. Testing POST /api/data/load with force_sample=True...")
load_req = json.dumps({"ticker": "AAPL", "force_sample": True}).encode("utf-8")
code, body = make_request(
    f"{BASE_URL}/data/load",
    data=load_req,
    headers={"Content-Type": "application/json"},
    method="POST"
)
assert code == 200
load_resp = json.loads(body)
assert load_resp["success"] is True
records = load_resp["data"]
print(f"   Passed! Loaded {len(records)} records. Latest price: {load_resp['metrics']['latest_price']}")

print("4. Testing POST /api/data/preprocess...")
prep_req = json.dumps({
    "missing_policy": "forward_fill",
    "scaler_type": "minmax",
    "lookback_window": 30,
    "forecast_horizon": 5,
    "target_column": "Close"
}).encode("utf-8")
code, body = make_request(
    f"{BASE_URL}/data/preprocess",
    data=prep_req,
    headers={"Content-Type": "application/json"},
    method="POST"
)
assert code == 200
prep_resp = json.loads(body)
assert prep_resp["success"] is True
print(f"   Passed! Preprocessing verified {len(prep_resp['pipeline_steps'])} steps.")

print("5. Testing POST /api/forecast/train...")
fc_req = json.dumps({
    "model_type": "MLP",
    "lookback_window": 30,
    "forecast_horizon": 5,
    "target_column": "Close",
    "train_split_ratio": 0.8
}).encode("utf-8")
code, body = make_request(
    f"{BASE_URL}/forecast/train",
    data=fc_req,
    headers={"Content-Type": "application/json"},
    method="POST"
)
assert code == 200
fc_resp = json.loads(body)
assert fc_resp["success"] is True
print(f"   Passed! Model MAE: {fc_resp['metrics']['mae']}, Future Horizon: {len(fc_resp['future_forecast'])} days")

print("6. Testing POST /api/backtest/run...")
bt_req = json.dumps({
    "strategy_type": "SMA_Crossover",
    "short_window": 10,
    "long_window": 30,
    "initial_capital": 10000.0,
    "transaction_cost_pct": 0.001
}).encode("utf-8")
code, body = make_request(
    f"{BASE_URL}/backtest/run",
    data=bt_req,
    headers={"Content-Type": "application/json"},
    method="POST"
)
assert code == 200
bt_resp = json.loads(body)
assert bt_resp["success"] is True
print(f"   Passed! Strategy Return: {bt_resp['metrics']['total_strategy_return_pct']}%, Win Rate: {bt_resp['metrics']['win_rate_pct']}%")

print("7. Testing POST /api/reports/export (CSV & HTML)...")
exp_csv_req = json.dumps({
    "export_type": "trades",
    "payload": {"trade_log": bt_resp["trade_log"]}
}).encode("utf-8")
code, body_csv = make_request(
    f"{BASE_URL}/reports/export",
    data=exp_csv_req,
    headers={"Content-Type": "application/json"},
    method="POST"
)
assert code == 200
assert b"trade_id" in body_csv
print("   Passed! Exported trades CSV successfully.")

exp_html_req = json.dumps({
    "export_type": "html_report",
    "payload": {
        "ticker": "AAPL",
        "company_name": "Apple Inc.",
        "data_source": "Sample Mode",
        "model_name": "MLPRegressor",
        "model_metrics": fc_resp["metrics"],
        "backtest_metrics": bt_resp["metrics"],
        "strategy_config": bt_resp["strategy"]
    }
}).encode("utf-8")
code, body_html = make_request(
    f"{BASE_URL}/reports/export",
    data=exp_html_req,
    headers={"Content-Type": "application/json"},
    method="POST"
)
assert code == 200
assert b"StockVision AI" in body_html
print("   Passed! Exported HTML report successfully.")

print("\nALL HTTP API ENDPOINTS TESTED AND VERIFIED 100% OPERATIONAL!")
