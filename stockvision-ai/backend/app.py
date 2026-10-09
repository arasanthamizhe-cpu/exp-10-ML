import os
import uvicorn
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from data_service import load_stock_data, process_uploaded_csv, get_sample_data, TICKER_NAMES
from preprocessing import run_preprocessing_pipeline
from forecasting import train_and_forecast, AVAILABLE_MODELS
from backtesting import run_backtest_strategy
from evaluation import evaluate_model_performance
from reports import generate_csv_export, generate_html_summary_report

app = FastAPI(
    title="StockVision AI API",
    description="Stock Market Forecasting & Backtesting Platform Backend",
    version="1.0.0"
)

# Enable CORS for React frontend running locally
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for active session data
session_state = {
    "historical_data": [],
    "metrics": {},
    "source": "None",
    "preprocessed_data": [],
    "last_forecast": {},
    "last_backtest": {}
}

# Request Models
class LoadDataRequest(BaseModel):
    ticker: str = "AAPL"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    interval: str = "1d"
    force_sample: bool = False

class PreprocessRequest(BaseModel):
    missing_policy: str = "forward_fill"  # forward_fill, backward_fill, drop
    scaler_type: str = "minmax"           # minmax, standard
    lookback_window: int = 30
    forecast_horizon: int = 5
    target_column: str = "Close"
    records: Optional[List[Dict[str, Any]]] = None

class ForecastRequest(BaseModel):
    model_type: str = "MLP"
    lookback_window: int = 30
    forecast_horizon: int = 5
    target_column: str = "Close"
    train_split_ratio: float = 0.8
    scaler_type: str = "minmax"
    records: Optional[List[Dict[str, Any]]] = None

class BacktestRequest(BaseModel):
    strategy_type: str = "SMA_Crossover"
    short_window: int = 10
    long_window: int = 30
    initial_capital: float = 10000.0
    transaction_cost_pct: float = 0.001
    position_size_pct: float = 1.0
    risk_free_rate_pct: float = 3.0
    records: Optional[List[Dict[str, Any]]] = None

class ExportRequest(BaseModel):
    export_type: str  # historical, predictions, trades, metrics, html_report
    payload: Dict[str, Any]

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "StockVision AI Backend",
        "available_models": list(AVAILABLE_MODELS.keys()),
        "has_cached_data": len(session_state["historical_data"]) > 0
    }

@app.get("/api/tickers")
def get_popular_tickers():
    return [
        {"ticker": "AAPL", "name": "Apple Inc.", "exchange": "NASDAQ", "has_sample": True},
        {"ticker": "MSFT", "name": "Microsoft Corporation", "exchange": "NASDAQ", "has_sample": False},
        {"ticker": "GOOGL", "name": "Alphabet Inc.", "exchange": "NASDAQ", "has_sample": False},
        {"ticker": "AMZN", "name": "Amazon.com Inc.", "exchange": "NASDAQ", "has_sample": False},
        {"ticker": "NVDA", "name": "NVIDIA Corporation", "exchange": "NASDAQ", "has_sample": False},
        {"ticker": "RELIANCE.NS", "name": "Reliance Industries Limited", "exchange": "NSE (India)", "has_sample": True},
        {"ticker": "TCS.NS", "name": "Tata Consultancy Services", "exchange": "NSE (India)", "has_sample": False},
        {"ticker": "INFY.NS", "name": "Infosys Limited", "exchange": "NSE (India)", "has_sample": False}
    ]

@app.get("/api/models")
def get_models_info():
    return AVAILABLE_MODELS

@app.post("/api/data/load")
def load_data(req: LoadDataRequest):
    res = load_stock_data(
        ticker=req.ticker,
        start_date=req.start_date,
        end_date=req.end_date,
        interval=req.interval,
        force_sample=req.force_sample
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to load data"))
        
    session_state["historical_data"] = res["data"]
    session_state["metrics"] = res["metrics"]
    session_state["source"] = res["source"]
    return res

@app.post("/api/data/upload")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
        
    contents = await file.read()
    res = process_uploaded_csv(contents, file.filename)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "CSV processing failed"))
        
    session_state["historical_data"] = res["data"]
    session_state["metrics"] = res["metrics"]
    session_state["source"] = res["source"]
    return res

@app.post("/api/data/preprocess")
def preprocess_data(req: PreprocessRequest):
    records = req.records or session_state["historical_data"]
    if not records:
        raise HTTPException(status_code=400, detail="No historical data loaded. Please load or upload data first.")
        
    res = run_preprocessing_pipeline(
        raw_records=records,
        missing_policy=req.missing_policy,
        scaler_type=req.scaler_type,
        lookback_window=req.lookback_window,
        forecast_horizon=req.forecast_horizon,
        target_column=req.target_column
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error"))
        
    session_state["preprocessed_data"] = res["cleaned_data"]
    return res

@app.post("/api/forecast/train")
@app.post("/api/forecast/predict")
def run_forecast(req: ForecastRequest):
    records = req.records or session_state["preprocessed_data"] or session_state["historical_data"]
    if not records:
        raise HTTPException(status_code=400, detail="No dataset available for model training. Load data first.")
        
    res = train_and_forecast(
        records=records,
        model_type=req.model_type,
        lookback_window=req.lookback_window,
        forecast_horizon=req.forecast_horizon,
        target_column=req.target_column,
        train_split_ratio=req.train_split_ratio,
        scaler_type=req.scaler_type
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error"))
        
    session_state["last_forecast"] = res
    return res

@app.post("/api/backtest/run")
def run_backtest(req: BacktestRequest):
    records = req.records or session_state["historical_data"]
    if not records:
        raise HTTPException(status_code=400, detail="No dataset available for backtesting. Load data first.")
        
    res = run_backtest_strategy(
        records=records,
        strategy_type=req.strategy_type,
        short_window=req.short_window,
        long_window=req.long_window,
        initial_capital=req.initial_capital,
        transaction_cost_pct=req.transaction_cost_pct,
        position_size_pct=req.position_size_pct,
        risk_free_rate_pct=req.risk_free_rate_pct
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error"))
        
    session_state["last_backtest"] = res
    return res

@app.post("/api/reports/export")
def export_report(req: ExportRequest):
    if req.export_type in ["historical", "predictions", "trades", "metrics"]:
        csv_text = generate_csv_export(req.export_type, req.payload)
        return Response(
            content=csv_text,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=stockvision_{req.export_type}.csv"}
        )
    elif req.export_type == "html_report":
        html_content = generate_html_summary_report(req.payload)
        return Response(
            content=html_content,
            media_type="text/html",
            headers={"Content-Disposition": "attachment; filename=stockvision_summary_report.html"}
        )
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported export type: {req.export_type}")

if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
