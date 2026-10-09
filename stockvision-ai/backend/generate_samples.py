import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_sample_data(ticker="AAPL", initial_price=175.0, start_date="2023-01-01", days=400, drift=0.0004, volatility=0.015):
    np.random.seed(42 if ticker == "AAPL" else 101)
    
    current_date = datetime.strptime(start_date, "%Y-%m-%d")
    dates = []
    while len(dates) < days:
        if current_date.weekday() < 5:  # Monday to Friday
            dates.append(current_date.strftime("%Y-%m-%d"))
        current_date += timedelta(days=1)
        
    prices = [initial_price]
    for _ in range(1, days):
        ret = np.random.normal(drift, volatility)
        prices.append(max(prices[-1] * (1 + ret), 1.0))
        
    records = []
    for i, date in enumerate(dates):
        close = round(prices[i], 2)
        daily_range = close * np.random.uniform(0.008, 0.025)
        high = round(close + daily_range * np.random.uniform(0.3, 0.7), 2)
        low = round(close - daily_range * np.random.uniform(0.3, 0.7), 2)
        open_price = round(np.random.uniform(low, high), 2)
        adj_close = close
        volume = int(np.random.normal(55000000, 12000000) if ticker == "AAPL" else np.random.normal(8500000, 2000000))
        volume = max(volume, 500000)
        
        records.append({
            "Date": date,
            "Open": open_price,
            "High": high,
            "Low": low,
            "Close": close,
            "Adj Close": adj_close,
            "Volume": volume
        })
        
    df = pd.DataFrame(records)
    return df

os.makedirs("sample_data", exist_ok=True)
df_aapl = generate_sample_data("AAPL", 170.0, "2023-01-03", 380, drift=0.0005, volatility=0.014)
df_aapl.to_csv("sample_data/AAPL_sample.csv", index=False)

df_rel = generate_sample_data("RELIANCE.NS", 2400.0, "2023-01-03", 380, drift=0.0004, volatility=0.012)
df_rel.to_csv("sample_data/RELIANCE_sample.csv", index=False)

print("Sample data generated successfully!")
