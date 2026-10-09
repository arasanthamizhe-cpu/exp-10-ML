import os
import io
import pandas as pd
import numpy as np
from datetime import datetime
import yfinance as yf

SAMPLE_DATA_DIR = os.path.join(os.path.dirname(__file__), "sample_data")

TICKER_NAMES = {
    "AAPL": "Apple Inc.",
    "MSFT": "Microsoft Corporation",
    "GOOGL": "Alphabet Inc.",
    "AMZN": "Amazon.com, Inc.",
    "NVDA": "NVIDIA Corporation",
    "RELIANCE.NS": "Reliance Industries Limited",
    "TCS.NS": "Tata Consultancy Services Ltd",
    "INFY.NS": "Infosys Limited"
}

def calculate_summary_metrics(df: pd.DataFrame, ticker: str, data_source: str):
    if df.empty or len(df) < 2:
        return {}
    
    df_sorted = df.sort_values(by="Date").reset_index(drop=True)
    latest_row = df_sorted.iloc[-1]
    prev_row = df_sorted.iloc[-2]
    
    latest_price = float(latest_row["Close"])
    prev_price = float(prev_row["Close"])
    price_change = round(latest_price - prev_price, 2)
    pct_change = round((price_change / prev_price) * 100, 2) if prev_price > 0 else 0.0
    
    # Calculate daily returns & annualized volatility (assuming 252 trading days)
    daily_returns = df_sorted["Close"].pct_change().dropna()
    volatility = float(daily_returns.std() * np.sqrt(252) * 100) if len(daily_returns) > 1 else 0.0
    
    high_52w = float(df_sorted["High"].max())
    low_52w = float(df_sorted["Low"].min())
    
    currency = "INR" if ticker.endswith(".NS") or ticker.endswith(".BO") else "USD"
    company_name = TICKER_NAMES.get(ticker.upper(), f"{ticker.upper()} Corporation")
    
    return {
        "ticker": ticker.upper(),
        "company_name": company_name,
        "currency": currency,
        "latest_price": round(latest_price, 2),
        "latest_date": str(latest_row["Date"]),
        "price_change": price_change,
        "pct_change": pct_change,
        "historical_volatility": round(volatility, 2),
        "high_52w": round(high_52w, 2),
        "low_52w": round(low_52w, 2),
        "total_records": len(df_sorted),
        "start_date": str(df_sorted.iloc[0]["Date"]),
        "end_date": str(df_sorted.iloc[-1]["Date"]),
        "data_source": data_source,
        "is_sample": "SAMPLE" in data_source.upper()
    }

def get_sample_data(ticker="AAPL"):
    ticker_clean = ticker.upper()
    sample_file = os.path.join(SAMPLE_DATA_DIR, f"{ticker_clean}_sample.csv")
    if not os.path.exists(sample_file):
        # Fallback to AAPL sample if specific ticker sample does not exist
        sample_file = os.path.join(SAMPLE_DATA_DIR, "AAPL_sample.csv")
    
    if os.path.exists(sample_file):
        df = pd.read_csv(sample_file)
        df["Date"] = pd.to_datetime(df["Date"]).dt.strftime("%Y-%m-%d")
        return df, "SAMPLE DATA — NOT REAL MARKET DATA"
    
    # Emergency synthetic dataframe if file missing
    dates = pd.date_range(end=datetime.today(), periods=200, freq="B").strftime("%Y-%m-%d")
    prices = np.cumprod(1 + np.random.normal(0.0005, 0.015, len(dates))) * 150.0
    df = pd.DataFrame({
        "Date": dates,
        "Open": np.round(prices * 0.995, 2),
        "High": np.round(prices * 1.015, 2),
        "Low": np.round(prices * 0.985, 2),
        "Close": np.round(prices, 2),
        "Adj Close": np.round(prices, 2),
        "Volume": np.random.randint(1000000, 50000000, len(dates))
    })
    return df, "SAMPLE DATA — NOT REAL MARKET DATA"

def fetch_yfinance_data(ticker: str, start_date: str = None, end_date: str = None, interval: str = "1d"):
    try:
        t = yf.Ticker(ticker)
        # Fetch with reasonable timeout
        df = t.history(start=start_date, end=end_date, interval=interval, timeout=10)
        if df.empty or len(df) < 5:
            return None, "No data returned by Yahoo Finance"
        
        df = df.reset_index()
        # Convert Date/Datetime to string YYYY-MM-DD
        if "Date" in df.columns:
            df["Date"] = pd.to_datetime(df["Date"]).dt.strftime("%Y-%m-%d")
        elif "Datetime" in df.columns:
            df["Date"] = pd.to_datetime(df["Datetime"]).dt.strftime("%Y-%m-%d")
        
        # Ensure standard column names
        required = ["Date", "Open", "High", "Low", "Close", "Volume"]
        for col in required:
            if col not in df.columns:
                return None, f"Missing required column {col} in fetched data"
                
        if "Adj Close" not in df.columns:
            df["Adj Close"] = df["Close"]
            
        df = df[["Date", "Open", "High", "Low", "Close", "Adj Close", "Volume"]]
        df = df.dropna(subset=["Close"]).sort_values("Date").reset_index(drop=True)
        return df, f"Yahoo Finance (End-of-day delayed, {interval})"
    except Exception as e:
        return None, str(e)

def load_stock_data(ticker: str = "AAPL", start_date: str = None, end_date: str = None, interval: str = "1d", force_sample: bool = False):
    ticker = ticker.strip().upper() if ticker else "AAPL"
    
    if force_sample:
        df, source = get_sample_data(ticker)
        metrics = calculate_summary_metrics(df, ticker, source)
        return {"success": True, "data": df.to_dict(orient="records"), "metrics": metrics, "source": source}
    
    # Try live yfinance
    df, source_or_err = fetch_yfinance_data(ticker, start_date, end_date, interval)
    if df is not None and not df.empty:
        metrics = calculate_summary_metrics(df, ticker, source_or_err)
        return {"success": True, "data": df.to_dict(orient="records"), "metrics": metrics, "source": source_or_err}
    
    # Fallback to sample data gracefully
    df, source = get_sample_data(ticker)
    source = f"SAMPLE DATA — NOT REAL MARKET DATA (Fallback: {source_or_err})"
    metrics = calculate_summary_metrics(df, ticker, source)
    return {
        "success": True,
        "data": df.to_dict(orient="records"),
        "metrics": metrics,
        "source": source,
        "fallback_notice": f"Live data for '{ticker}' could not be reached ({source_or_err}). Loaded realistic sample data."
    }

def process_uploaded_csv(file_bytes: bytes, filename: str):
    try:
        df = pd.read_csv(io.BytesIO(file_bytes))
        
        # Normalize column names: strip spaces, case check
        col_map = {}
        for c in df.columns:
            c_clean = c.strip()
            for std in ["Date", "Open", "High", "Low", "Close", "Adj Close", "Volume"]:
                if c_clean.lower() == std.lower():
                    col_map[c] = std
                    break
        df = df.rename(columns=col_map)
        
        required = ["Date", "Open", "High", "Low", "Close"]
        missing = [col for col in required if col not in df.columns]
        if missing:
            return {
                "success": False,
                "error": f"CSV missing required columns: {', '.join(missing)}. Must contain at least Date, Open, High, Low, Close."
            }
            
        if "Volume" not in df.columns:
            df["Volume"] = 1000000
        if "Adj Close" not in df.columns:
            df["Adj Close"] = df["Close"]
            
        df["Date"] = pd.to_datetime(df["Date"], errors="coerce").dt.strftime("%Y-%m-%d")
        df = df.dropna(subset=["Date", "Close"])
        df = df.sort_values(by="Date").reset_index(drop=True)
        
        if len(df) < 15:
            return {
                "success": False,
                "error": f"Uploaded dataset has only {len(df)} rows. At least 15 observations are required for analysis and modeling."
            }
            
        ticker = os.path.splitext(filename)[0].upper()[:10]
        source = f"Uploaded File: {filename}"
        metrics = calculate_summary_metrics(df, ticker, source)
        
        return {
            "success": True,
            "data": df.to_dict(orient="records"),
            "metrics": metrics,
            "source": source
        }
    except Exception as e:
        return {"success": False, "error": f"Failed to parse CSV file: {str(e)}"}
