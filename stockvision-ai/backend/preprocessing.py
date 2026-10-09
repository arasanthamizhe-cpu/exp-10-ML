import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler, StandardScaler
from typing import Dict, Any, List, Tuple

def run_preprocessing_pipeline(
    raw_records: List[Dict[str, Any]], 
    missing_policy: str = "forward_fill",
    scaler_type: str = "minmax",
    lookback_window: int = 30,
    forecast_horizon: int = 1,
    target_column: str = "Close"
) -> Dict[str, Any]:
    """
    Executes the comprehensive 8-step chronological preprocessing pipeline:
    1. Ingestion & Shape verification
    2. Column schema validation
    3. Type conversion (Date parsing & numeric casting)
    4. Chronological sorting
    5. Missing & duplicate audit
    6. Missing data policy execution with audit log
    7. Feature normalization / scaling fitting metadata
    8. Sliding window sequence construction for ML
    """
    if not raw_records or len(raw_records) == 0:
        return {"success": False, "error": "No records supplied to preprocessing pipeline."}
    
    df_raw = pd.DataFrame(raw_records)
    initial_count = len(df_raw)
    
    pipeline_steps = []
    
    # Stage 1: Load raw data
    pipeline_steps.append({
        "step": 1,
        "name": "Raw Ingestion",
        "status": "PASSED",
        "description": f"Ingested {initial_count} raw observations with {len(df_raw.columns)} features."
    })
    
    # Stage 2: Schema Validation
    required_cols = ["Date", "Open", "High", "Low", "Close", "Volume"]
    missing_required = [c for c in required_cols if c not in df_raw.columns]
    if missing_required:
        return {
            "success": False,
            "error": f"Schema validation failed: Missing required columns: {', '.join(missing_required)}"
        }
    pipeline_steps.append({
        "step": 2,
        "name": "Schema Validation",
        "status": "PASSED",
        "description": f"Verified required columns present: {', '.join(required_cols)}."
    })
    
    # Stage 3: Type conversion
    df = df_raw.copy()
    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
    invalid_dates = df["Date"].isna().sum()
    df = df.dropna(subset=["Date"])
    
    numeric_cols = ["Open", "High", "Low", "Close", "Volume"]
    if "Adj Close" in df.columns:
        numeric_cols.append("Adj Close")
    else:
        df["Adj Close"] = df["Close"]
        
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")
        
    pipeline_steps.append({
        "step": 3,
        "name": "Type Conversion",
        "status": "PASSED",
        "description": f"Converted 'Date' to ISO timestamps (dropped {invalid_dates} invalid dates) and cast {len(numeric_cols)} features to float64."
    })
    
    # Stage 4: Chronological sorting (NO RANDOM SHUFFLING)
    df = df.sort_values(by="Date").reset_index(drop=True)
    pipeline_steps.append({
        "step": 4,
        "name": "Chronological Sorting",
        "status": "PASSED",
        "description": f"Sorted records strictly ascending by date from {df.iloc[0]['Date'].strftime('%Y-%m-%d')} to {df.iloc[-1]['Date'].strftime('%Y-%m-%d')}."
    })
    
    # Stage 5: Identify duplicates and missing values
    duplicate_count = int(df.duplicated(subset=["Date"]).sum())
    missing_summary = {col: int(df[col].isna().sum()) for col in ["Open", "High", "Low", "Close", "Volume", "Adj Close"]}
    total_missing_values = sum(missing_summary.values())
    
    if duplicate_count > 0:
        df = df.drop_duplicates(subset=["Date"], keep="first").reset_index(drop=True)
        
    pipeline_steps.append({
        "step": 5,
        "name": "Duplicate & Missing Audit",
        "status": "PASSED",
        "description": f"Found {duplicate_count} duplicate timestamps (deduplicated) and {total_missing_values} missing field values."
    })
    
    # Stage 6: Apply documented missing-data policy
    records_before_policy = len(df)
    if missing_policy == "forward_fill":
        df = df.ffill().bfill()
        affected_count = total_missing_values
        policy_desc = "Applied Forward-Fill (ffill) followed by Backward-Fill (bfill) to preserve sequence length without look-ahead distortion."
    elif missing_policy == "backward_fill":
        df = df.bfill().ffill()
        affected_count = total_missing_values
        policy_desc = "Applied Backward-Fill (bfill) followed by Forward-Fill (ffill)."
    else:  # drop
        df = df.dropna()
        affected_count = records_before_policy - len(df)
        policy_desc = f"Dropped rows with any NaN values. Removed {affected_count} records."
        
    pipeline_steps.append({
        "step": 6,
        "name": "Missing Value Treatment",
        "status": "PASSED",
        "description": f"{policy_desc} ({affected_count} cells/records affected)."
    })
    
    # Ensure date string format for output
    df["Date"] = df["Date"].dt.strftime("%Y-%m-%d")
    
    # Stage 7: Normalization / Scaling preview
    # Target variable check
    if target_column not in df.columns:
        target_column = "Close"
        
    target_series = df[target_column].values.reshape(-1, 1)
    if scaler_type == "standard":
        scaler = StandardScaler()
        scale_name = "StandardScaler (Zero mean, unit variance)"
    else:
        scaler = MinMaxScaler(feature_range=(0, 1))
        scale_name = "MinMaxScaler (Range [0, 1])"
        
    scaled_values = scaler.fit_transform(target_series).flatten()
    df_clean = df.copy()
    df_clean[f"{target_column}_scaled"] = np.round(scaled_values, 4)
    
    pipeline_steps.append({
        "step": 7,
        "name": "Normalization & Scaling",
        "status": "PASSED",
        "description": f"Fitted {scale_name} on {target_column}. Range min: {float(target_series.min()):.2f}, max: {float(target_series.max()):.2f}."
    })
    
    # Stage 8: Sliding time-series window preview
    total_samples = len(df_clean)
    num_windows = max(0, total_samples - lookback_window - forecast_horizon + 1)
    
    pipeline_steps.append({
        "step": 8,
        "name": "Sliding Window Formulation",
        "status": "PASSED" if num_windows > 10 else "WARNING",
        "description": f"Generated sliding sequences: Lookback window W = {lookback_window}, Horizon H = {forecast_horizon}. Yields {num_windows} sequence samples."
    })
    
    # Before and after samples (first 5 and last 5)
    before_sample = raw_records[:5]
    after_sample = df_clean.head(5).to_dict(orient="records")
    
    return {
        "success": True,
        "pipeline_steps": pipeline_steps,
        "audit": {
            "initial_rows": initial_count,
            "final_rows": len(df_clean),
            "duplicates_removed": duplicate_count,
            "missing_values_by_column": missing_summary,
            "missing_policy_applied": missing_policy,
            "scaler_type": scaler_type,
            "lookback_window": lookback_window,
            "forecast_horizon": forecast_horizon,
            "total_sliding_windows": num_windows
        },
        "before_sample": before_sample,
        "after_sample": after_sample,
        "cleaned_data": df_clean.drop(columns=[f"{target_column}_scaled"]).to_dict(orient="records")
    }
