import io
import pandas as pd
from typing import Dict, Any, List

def generate_csv_export(data_type: str, payload: Dict[str, Any]) -> str:
    """Generates standard CSV content as a string for downloading."""
    if data_type == "historical":
        records = payload.get("records", [])
        if not records:
            return "Date,Open,High,Low,Close,Adj Close,Volume\n"
        df = pd.DataFrame(records)
        return df.to_csv(index=False)
        
    elif data_type == "predictions":
        test_preds = payload.get("test_predictions", [])
        future_preds = payload.get("future_forecast", [])
        
        combined_records = []
        for r in test_preds:
            combined_records.append({
                "Date": r.get("date"),
                "Type": "Test Out-of-Sample",
                "Actual_Price": r.get("actual"),
                "Predicted_Price": r.get("predicted"),
                "Residual_Error": r.get("residual"),
                "Horizon_Step": ""
            })
            
        for r in future_preds:
            combined_records.append({
                "Date": r.get("date"),
                "Type": "Future Forecast",
                "Actual_Price": "",
                "Predicted_Price": r.get("predicted_price"),
                "Residual_Error": "",
                "Horizon_Step": r.get("horizon_step")
            })
            
        df = pd.DataFrame(combined_records)
        return df.to_csv(index=False)
        
    elif data_type == "trades":
        trades = payload.get("trade_log", [])
        if not trades:
            return "trade_id,entry_date,exit_date,entry_price,exit_price,shares,pnl,return_pct,duration_days,status\n"
        df = pd.DataFrame(trades)
        return df.to_csv(index=False)
        
    elif data_type == "metrics":
        model_metrics = payload.get("model_metrics", {})
        backtest_metrics = payload.get("backtest_metrics", {})
        
        rows = [
            {"Category": "Forecasting", "Metric": "Model Name", "Value": payload.get("model_name", "MLP")},
            {"Category": "Forecasting", "Metric": "MAE (Mean Absolute Error)", "Value": model_metrics.get("mae", "N/A")},
            {"Category": "Forecasting", "Metric": "RMSE (Root Mean Squared Error)", "Value": model_metrics.get("rmse", "N/A")},
            {"Category": "Forecasting", "Metric": "MAPE (%)", "Value": model_metrics.get("mape", "N/A")},
            {"Category": "Forecasting", "Metric": "R-Squared", "Value": model_metrics.get("r2_score", "N/A")},
            {"Category": "Forecasting", "Metric": "Directional Accuracy (%)", "Value": model_metrics.get("directional_accuracy_pct", "N/A")},
            {"Category": "Backtesting", "Metric": "Initial Capital", "Value": backtest_metrics.get("initial_capital", "N/A")},
            {"Category": "Backtesting", "Metric": "Final Portfolio Value", "Value": backtest_metrics.get("final_equity", "N/A")},
            {"Category": "Backtesting", "Metric": "Strategy Return (%)", "Value": backtest_metrics.get("total_strategy_return_pct", "N/A")},
            {"Category": "Backtesting", "Metric": "Buy & Hold Benchmark Return (%)", "Value": backtest_metrics.get("benchmark_return_pct", "N/A")},
            {"Category": "Backtesting", "Metric": "Alpha vs Benchmark (%)", "Value": backtest_metrics.get("alpha_pct", "N/A")},
            {"Category": "Backtesting", "Metric": "Annualized Return (CAGR %)", "Value": backtest_metrics.get("annualized_return_cagr_pct", "N/A")},
            {"Category": "Backtesting", "Metric": "Maximum Drawdown (%)", "Value": backtest_metrics.get("max_drawdown_pct", "N/A")},
            {"Category": "Backtesting", "Metric": "Sharpe Ratio", "Value": backtest_metrics.get("sharpe_ratio", "N/A")},
            {"Category": "Backtesting", "Metric": "Total Trades Executed", "Value": backtest_metrics.get("total_trades", "N/A")},
            {"Category": "Backtesting", "Metric": "Win Rate (%)", "Value": backtest_metrics.get("win_rate_pct", "N/A")},
            {"Category": "Backtesting", "Metric": "Total Transaction Costs Paid", "Value": backtest_metrics.get("total_transaction_costs", "N/A")}
        ]
        df = pd.DataFrame(rows)
        return df.to_csv(index=False)
        
    return ""

def generate_html_summary_report(payload: Dict[str, Any]) -> str:
    """Generates an academic-grade, printable HTML executive summary report."""
    ticker = payload.get("ticker", "AAPL")
    company = payload.get("company_name", "Apple Inc.")
    source = payload.get("data_source", "Market Data")
    model_name = payload.get("model_name", "Multi-Layer Perceptron (MLPRegressor)")
    m_met = payload.get("model_metrics", {})
    b_met = payload.get("backtest_metrics", {})
    strat = payload.get("strategy_config", {})
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>StockVision AI Executive Report — {ticker}</title>
  <style>
    body {{
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      margin: 40px auto;
      max-width: 960px;
      color: #1e293b;
      background: #f8fafc;
      line-height: 1.6;
    }}
    .report-card {{
      background: #ffffff;
      padding: 36px;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
    }}
    .header {{
      border-bottom: 2px solid #0284c7;
      padding-bottom: 20px;
      margin-bottom: 28px;
    }}
    .header h1 {{
      margin: 0 0 6px 0;
      color: #0f172a;
      font-size: 26px;
    }}
    .tag {{
      display: inline-block;
      background: #e0f2fe;
      color: #0369a1;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
    }}
    .grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 24px 0;
    }}
    .box {{
      background: #f8fafc;
      padding: 18px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }}
    .box h3 {{
      margin-top: 0;
      color: #0369a1;
      font-size: 16px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 14px;
    }}
    th, td {{
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }}
    th {{
      background: #f1f5f9;
      color: #475569;
    }}
    .highlight {{
      font-weight: bold;
      color: #0f172a;
    }}
    .disclaimer {{
      margin-top: 36px;
      padding: 16px;
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      font-size: 13px;
      color: #991b1b;
      border-radius: 4px;
    }}
    .footer {{
      margin-top: 24px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }}
    @media print {{
      body {{ margin: 0; background: #fff; }}
      .report-card {{ border: none; box-shadow: none; padding: 20px; }}
    }}
  </style>
</head>
<body>
  <div class="report-card">
    <div class="header">
      <h1>StockVision AI — Comprehensive Technical Report</h1>
      <div><span class="tag">{ticker}</span> &nbsp; <strong>{company}</strong> &nbsp; | &nbsp; Source: <em>{source}</em></div>
    </div>

    <div class="grid">
      <div class="box">
        <h3>Machine Learning Forecasting Model</h3>
        <p><strong>Architecture:</strong> {model_name}</p>
        <table>
          <tr><td>Mean Absolute Error (MAE):</td><td class="highlight">{m_met.get('mae', 'N/A')}</td></tr>
          <tr><td>Root Mean Squared Error (RMSE):</td><td class="highlight">{m_met.get('rmse', 'N/A')}</td></tr>
          <tr><td>Mean Absolute Pct Error (MAPE):</td><td class="highlight">{m_met.get('mape', 'N/A')}%</td></tr>
          <tr><td>Coefficient of Determination (R²):</td><td class="highlight">{m_met.get('r2_score', 'N/A')}</td></tr>
          <tr><td>Directional Hit Rate:</td><td class="highlight">{m_met.get('directional_accuracy_pct', 'N/A')}%</td></tr>
        </table>
      </div>

      <div class="box">
        <h3>Backtesting & Strategy Performance</h3>
        <p><strong>Strategy:</strong> {strat.get('name', 'Moving Average Crossover')}</p>
        <table>
          <tr><td>Initial Capital:</td><td class="highlight">${b_met.get('initial_capital', '10000'):,}</td></tr>
          <tr><td>Final Portfolio Value:</td><td class="highlight">${b_met.get('final_equity', 'N/A'):,}</td></tr>
          <tr><td>Total Strategy Return:</td><td class="highlight" style="color: {'#16a34a' if b_met.get('total_strategy_return_pct', 0) >= 0 else '#dc2626'}">{b_met.get('total_strategy_return_pct', 'N/A')}%</td></tr>
          <tr><td>Buy & Hold Benchmark:</td><td class="highlight">{b_met.get('benchmark_return_pct', 'N/A')}%</td></tr>
          <tr><td>Alpha vs Benchmark:</td><td class="highlight">{b_met.get('alpha_pct', 'N/A')}%</td></tr>
          <tr><td>Max Drawdown:</td><td class="highlight">{b_met.get('max_drawdown_pct', 'N/A')}%</td></tr>
          <tr><td>Sharpe Ratio:</td><td class="highlight">{b_met.get('sharpe_ratio', 'N/A')}</td></tr>
          <tr><td>Win Rate:</td><td class="highlight">{b_met.get('win_rate_pct', 'N/A')}% ({b_met.get('total_trades', 0)} trades)</td></tr>
        </table>
      </div>
    </div>

    <div class="box" style="margin-top: 20px;">
      <h3>Methodology & Validation Integrity</h3>
      <p style="font-size: 14px;">
        This platform enforces strict time-series principles. Models are evaluated using chronological out-of-sample partitioning without random shuffling. Feature normalizers are fitted exclusively on the training partition to prevent look-ahead bias and information leakage. The algorithmic backtest executes trading signals with a one-period delay and applies documented transaction costs.
      </p>
    </div>

    <div class="disclaimer">
      <strong>Academic & Educational Disclaimer:</strong> All predictions and simulated backtesting metrics generated by StockVision AI are for academic and demonstration purposes only. They do not constitute financial, investment, or legal advice. Real market execution involves slippage, liquidity constraints, and market impacts not fully modeled here.
    </div>

    <div class="footer">
      Generated by StockVision AI Platform &bull; Engineering Capstone System
    </div>
  </div>
</body>
</html>"""
    return html
