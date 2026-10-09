import pandas as pd
import numpy as np
from typing import Dict, Any, List

def run_backtest_strategy(
    records: List[Dict[str, Any]],
    strategy_type: str = "SMA_Crossover",
    short_window: int = 10,
    long_window: int = 30,
    initial_capital: float = 10000.0,
    transaction_cost_pct: float = 0.001,  # 0.1% per trade
    position_size_pct: float = 1.0,       # 100% of available cash
    risk_free_rate_pct: float = 3.0       # 3% annual risk-free rate for Sharpe
) -> Dict[str, Any]:
    """
    Simulates historical trading strategy strictly avoiding look-ahead bias:
    - Signals computed at Day t close using observations up to Day t.
    - Orders executed at Day t+1.
    - Deducts transaction fees upon each buy and sell transaction.
    - Long-only portfolio simulator (cash vs stock position).
    - Benchmarked against Buy-and-Hold.
    """
    if not records or len(records) < (long_window + 5):
        return {
            "success": False,
            "error": f"Insufficient data ({len(records) if records else 0} records). Need at least {long_window + 5} records for long window of {long_window}."
        }
        
    df = pd.DataFrame(records)
    df["Date"] = pd.to_datetime(df["Date"]).dt.strftime("%Y-%m-%d")
    df = df.sort_values(by="Date").reset_index(drop=True)
    
    close_prices = df["Close"].astype(float).values
    dates = df["Date"].values
    n = len(df)
    
    # 1. Compute Technical Indicators
    short_ma = pd.Series(close_prices).rolling(window=short_window).mean().values
    long_ma = pd.Series(close_prices).rolling(window=long_window).mean().values
    
    # 2. Generate Signals at Close of Day t:
    # 1 = Long, 0 = Cash
    signals = np.zeros(n)
    for t in range(long_window, n):
        if short_ma[t] > long_ma[t]:
            signals[t] = 1
        else:
            signals[t] = 0
            
    # 3. Simulate Portfolio State Day by Day:
    # Look-ahead prevention: A signal generated at close t is entered at t+1
    # Thus, position on day t is based on signal from day t-1
    positions = np.zeros(n)
    positions[1:] = signals[:-1]  # Shifted by 1 day!
    
    cash = initial_capital
    shares = 0.0
    equity_curve = []
    trade_log = []
    total_costs_paid = 0.0
    
    current_trade = None
    
    # Benchmark buy & hold shares bought on Day 0
    benchmark_initial_price = close_prices[0]
    benchmark_shares = (initial_capital * (1.0 - transaction_cost_pct)) / benchmark_initial_price
    
    for t in range(n):
        price = close_prices[t]
        date_str = str(dates[t])
        target_pos = positions[t]
        
        # Check transition (Buy or Sell)
        # Transition: 0 -> 1 (Buy signal active from yesterday)
        if target_pos == 1 and shares == 0.0 and cash > 0:
            alloc_cash = cash * position_size_pct
            cost = alloc_cash * transaction_cost_pct
            invest_cash = alloc_cash - cost
            total_costs_paid += cost
            shares_bought = invest_cash / price
            shares = shares_bought
            cash -= alloc_cash
            
            current_trade = {
                "trade_id": len(trade_log) + 1,
                "type": "BUY",
                "entry_date": date_str,
                "entry_price": round(price, 2),
                "shares": round(shares_bought, 4),
                "entry_cost": round(cost, 2),
                "entry_capital": round(alloc_cash, 2)
            }
            
        # Transition: 1 -> 0 (Sell signal active from yesterday)
        elif target_pos == 0 and shares > 0.0:
            gross_proceeds = shares * price
            cost = gross_proceeds * transaction_cost_pct
            net_proceeds = gross_proceeds - cost
            total_costs_paid += cost
            cash += net_proceeds
            
            if current_trade:
                pnl = net_proceeds - current_trade["entry_capital"]
                pnl_pct = (pnl / current_trade["entry_capital"]) * 100.0
                entry_date_dt = pd.to_datetime(current_trade["entry_date"])
                exit_date_dt = pd.to_datetime(date_str)
                duration_days = int((exit_date_dt - entry_date_dt).days)
                
                trade_log.append({
                    "trade_id": current_trade["trade_id"],
                    "entry_date": current_trade["entry_date"],
                    "exit_date": date_str,
                    "entry_price": current_trade["entry_price"],
                    "exit_price": round(price, 2),
                    "shares": current_trade["shares"],
                    "pnl": round(pnl, 2),
                    "return_pct": round(pnl_pct, 2),
                    "duration_days": duration_days,
                    "status": "WIN" if pnl > 0 else "LOSS"
                })
                current_trade = None
            shares = 0.0
            
        # Current daily equity
        strategy_equity = cash + (shares * price)
        benchmark_equity = benchmark_shares * price
        
        equity_curve.append({
            "date": date_str,
            "price": round(price, 2),
            "short_ma": round(float(short_ma[t]), 2) if not np.isnan(short_ma[t]) else None,
            "long_ma": round(float(long_ma[t]), 2) if not np.isnan(long_ma[t]) else None,
            "strategy_equity": round(strategy_equity, 2),
            "benchmark_equity": round(benchmark_equity, 2),
            "position": "LONG" if shares > 0 else "CASH",
            "cash": round(cash, 2)
        })
        
    # If a trade remains open at the end of backtest, log it as OPEN
    if current_trade and shares > 0:
        last_price = close_prices[-1]
        gross_proceeds = shares * last_price
        est_cost = gross_proceeds * transaction_cost_pct
        net_proceeds = gross_proceeds - est_cost
        pnl = net_proceeds - current_trade["entry_capital"]
        pnl_pct = (pnl / current_trade["entry_capital"]) * 100.0
        trade_log.append({
            "trade_id": current_trade["trade_id"],
            "entry_date": current_trade["entry_date"],
            "exit_date": str(dates[-1]) + " (Open)",
            "entry_price": current_trade["entry_price"],
            "exit_price": round(last_price, 2),
            "shares": current_trade["shares"],
            "pnl": round(pnl, 2),
            "return_pct": round(pnl_pct, 2),
            "duration_days": int((pd.to_datetime(dates[-1]) - pd.to_datetime(current_trade["entry_date"])).days),
            "status": "OPEN (WIN)" if pnl > 0 else "OPEN (LOSS)"
        })
        
    # 4. Performance Metrics Computation
    final_strategy_equity = equity_curve[-1]["strategy_equity"]
    final_benchmark_equity = equity_curve[-1]["benchmark_equity"]
    
    strategy_return_pct = ((final_strategy_equity - initial_capital) / initial_capital) * 100.0
    benchmark_return_pct = ((final_benchmark_equity - initial_capital) / initial_capital) * 100.0
    
    # Calculate Drawdown Curve
    strat_equities = np.array([pt["strategy_equity"] for pt in equity_curve])
    running_max = np.maximum.accumulate(strat_equities)
    drawdowns = (strat_equities - running_max) / running_max * 100.0
    max_drawdown = float(np.min(drawdowns))  # negative percentage
    
    # Add drawdown to equity curve points
    for idx, pt in enumerate(equity_curve):
        pt["drawdown_pct"] = round(float(drawdowns[idx]), 2)
        
    # Annualized Return (CAGR)
    start_dt = pd.to_datetime(dates[0])
    end_dt = pd.to_datetime(dates[-1])
    years = max((end_dt - start_dt).days / 365.25, 0.1)
    
    if final_strategy_equity > 0:
        cagr_strategy = ((final_strategy_equity / initial_capital) ** (1.0 / years) - 1.0) * 100.0
    else:
        cagr_strategy = -100.0
        
    cagr_benchmark = ((final_benchmark_equity / initial_capital) ** (1.0 / years) - 1.0) * 100.0
    
    # Sharpe Ratio
    daily_equity_series = pd.Series(strat_equities)
    daily_returns = daily_equity_series.pct_change().dropna()
    rf_daily = (risk_free_rate_pct / 100.0) / 252.0
    excess_returns = daily_returns - rf_daily
    
    if len(daily_returns) > 1 and daily_returns.std() > 0:
        sharpe_ratio = float((excess_returns.mean() / daily_returns.std()) * np.sqrt(252))
    else:
        sharpe_ratio = 0.0
        
    # Trade statistics
    total_trades = len(trade_log)
    closed_trades = [t for t in trade_log if "OPEN" not in t["status"]]
    winning_trades = [t for t in trade_log if t["pnl"] > 0]
    losing_trades = [t for t in trade_log if t["pnl"] <= 0]
    win_rate = (len(winning_trades) / total_trades * 100.0) if total_trades > 0 else 0.0
    
    return {
        "success": True,
        "strategy": {
            "name": f"Moving Average Crossover (SMA {short_window} / SMA {long_window})",
            "type": strategy_type,
            "short_window": short_window,
            "long_window": long_window,
            "transaction_cost_pct": transaction_cost_pct * 100.0,
            "position_size_pct": position_size_pct * 100.0,
            "initial_capital": initial_capital,
            "risk_free_rate_pct": risk_free_rate_pct
        },
        "metrics": {
            "initial_capital": round(initial_capital, 2),
            "final_equity": round(final_strategy_equity, 2),
            "total_strategy_return_pct": round(strategy_return_pct, 2),
            "benchmark_return_pct": round(benchmark_return_pct, 2),
            "alpha_pct": round(strategy_return_pct - benchmark_return_pct, 2),
            "annualized_return_cagr_pct": round(cagr_strategy, 2),
            "benchmark_cagr_pct": round(cagr_benchmark, 2),
            "max_drawdown_pct": round(max_drawdown, 2),
            "sharpe_ratio": round(sharpe_ratio, 2),
            "total_trades": total_trades,
            "winning_trades": len(winning_trades),
            "losing_trades": len(losing_trades),
            "win_rate_pct": round(win_rate, 2),
            "total_transaction_costs": round(total_costs_paid, 2)
        },
        "equity_curve": equity_curve,
        "trade_log": trade_log,
        "disclaimer": "DISCLAIMER: Past backtested returns do not assure future investment performance. Backtests incorporate assumptions and simulated slippage/costs."
    }
