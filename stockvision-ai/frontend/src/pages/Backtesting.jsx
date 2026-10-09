import React, { useState } from "react";
import EquityCurveChart from "../charts/EquityCurveChart";
import DrawdownChart from "../charts/DrawdownChart";
import PriceChart from "../charts/PriceChart";
import {
  LineChart as LineChartIcon,
  Play,
  Download,
  AlertTriangle,
  Award,
  DollarSign,
  Percent,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Clock,
  ArrowRight
} from "lucide-react";
import { api, triggerDownload } from "../services/api";

export default function Backtesting({
  historicalData = [],
  backtestData = null,
  setBacktestData,
  metrics = {},
  setCurrentPage
}) {
  const [strategyType, setStrategyType] = useState("SMA_Crossover");
  const [shortWindow, setShortWindow] = useState(10);
  const [longWindow, setLongWindow] = useState(30);
  const [initialCapital, setInitialCapital] = useState(10000);
  const [transactionCostPct, setTransactionCostPct] = useState(0.1); // in percent
  const [positionSizePct, setPositionSizePct] = useState(100);       // in percent
  const [riskFreeRatePct, setRiskFreeRatePct] = useState(3.0);       // in percent
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRunBacktest = async () => {
    if (!historicalData || historicalData.length === 0) {
      setError("Please load historical stock data from Explorer before running backtesting.");
      return;
    }

    if (Number(shortWindow) >= Number(longWindow)) {
      setError("Short moving average window must be strictly smaller than the long moving average window.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.runBacktest({
        records: historicalData,
        strategy_type: strategyType,
        short_window: Number(shortWindow),
        long_window: Number(longWindow),
        initial_capital: Number(initialCapital),
        transaction_cost_pct: Number(transactionCostPct) / 100.0,
        position_size_pct: Number(positionSizePct) / 100.0,
        risk_free_rate_pct: Number(riskFreeRatePct)
      });
      setBacktestData(res);
    } catch (err) {
      setError(err.message || "Backtest failed");
    } finally {
      setLoading(false);
    }
  };

  const handleExportTradesCSV = async () => {
    if (!backtestData) return;
    try {
      const blob = await api.exportReport("trades", { trade_log: backtestData.trade_log });
      triggerDownload(blob, `${metrics.ticker || "stock"}_backtest_trades.csv`);
    } catch (err) {
      alert("Export failed: " + err.message);
    }
  };

  return (
    <div className="page-body">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <LineChartIcon className="text-cyan" size={24} />
            Systematic Strategy Backtesting Simulator
          </h1>
          <p className="page-subtitle">
            Simulate moving average crossovers with execution delays, commissions, and benchmark against Buy-and-Hold.
          </p>
        </div>

        {backtestData?.success && (
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-secondary" onClick={handleExportTradesCSV}>
              <Download size={15} /> Export Trades CSV
            </button>
            <button className="btn btn-primary" onClick={() => setCurrentPage("reports")}>
              Generate Report <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Disclaimers & Bias Safeguards */}
      <div className="alert-banner alert-warning">
        <AlertTriangle size={18} style={{ flexShrink: 0 }} />
        <div>
          <strong>LOOK-AHEAD BIAS SAFEGUARD:</strong> Signals are triggered on the close of Day t and executed on Day t+1.
          Simulated returns deduct <strong>{transactionCostPct}% transaction commissions</strong> on each trade. Past returns do not guarantee future performance.
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-danger">
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <div>{error}</div>
        </div>
      )}

      {/* Configuration Controls */}
      <div className="card">
        <h2 className="card-title" style={{ marginBottom: 14 }}>
          <LineChartIcon size={18} className="text-cyan" />
          Strategy Hyperparameters & Portfolio Settings
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Strategy Mechanism</label>
            <select
              className="select"
              value={strategyType}
              onChange={e => setStrategyType(e.target.value)}
            >
              <option value="SMA_Crossover">SMA Golden/Death Cross (Trend-Following)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Short SMA Window</label>
            <select
              className="select"
              value={shortWindow}
              onChange={e => setShortWindow(Number(e.target.value))}
            >
              <option value="5">5 Days (Ultra Short)</option>
              <option value="10">10 Days (Fast Trend)</option>
              <option value="15">15 Days</option>
              <option value="20">20 Days (Monthly)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Long SMA Window</label>
            <select
              className="select"
              value={longWindow}
              onChange={e => setLongWindow(Number(e.target.value))}
            >
              <option value="20">20 Days</option>
              <option value="30">30 Days (Intermediate)</option>
              <option value="50">50 Days (Quarterly / Standard)</option>
              <option value="100">100 Days (Long-term)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Initial Capital ($)</label>
            <input
              type="number"
              className="input"
              value={initialCapital}
              onChange={e => setInitialCapital(Number(e.target.value))}
              min="1000"
              step="500"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Transaction Fee (% per trade)</label>
            <input
              type="number"
              className="input"
              value={transactionCostPct}
              onChange={e => setTransactionCostPct(Number(e.target.value))}
              step="0.05"
              min="0"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Risk-Free Rate (% p.a.)</label>
            <input
              type="number"
              className="input"
              value={riskFreeRatePct}
              onChange={e => setRiskFreeRatePct(Number(e.target.value))}
              step="0.5"
            />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <button
            className="btn btn-primary"
            onClick={handleRunBacktest}
            disabled={loading}
          >
            <Play size={15} /> {loading ? "Simulating Execution..." : "Run Historical Backtest Simulation"}
          </button>
        </div>
      </div>

      {/* Backtesting Results */}
      {backtestData && (
        <>
          {/* Key Metric Grid */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">FINAL STRATEGY VALUE</div>
              <div className="metric-value font-mono">
                ${backtestData.metrics.final_equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="metric-sub">
                <span className={backtestData.metrics.total_strategy_return_pct >= 0 ? "text-bullish" : "text-bearish"}>
                  {backtestData.metrics.total_strategy_return_pct >= 0 ? "+" : ""}{backtestData.metrics.total_strategy_return_pct}% total return
                </span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">BUY & HOLD BENCHMARK</div>
              <div className="metric-value font-mono">
                {backtestData.metrics.benchmark_return_pct >= 0 ? "+" : ""}{backtestData.metrics.benchmark_return_pct}%
              </div>
              <div className="metric-sub">
                <span className={backtestData.metrics.alpha_pct >= 0 ? "text-bullish" : "text-bearish"}>
                  Alpha: {backtestData.metrics.alpha_pct >= 0 ? "+" : ""}{backtestData.metrics.alpha_pct}%
                </span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">MAXIMUM DRAWDOWN</div>
              <div className="metric-value font-mono text-bearish">
                {backtestData.metrics.max_drawdown_pct}%
              </div>
              <div className="metric-sub" style={{ color: "#94a3b8" }}>Peak-to-trough decline</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">SHARPE RATIO (ANNUALIZED)</div>
              <div className="metric-value font-mono">
                {backtestData.metrics.sharpe_ratio}
              </div>
              <div className="metric-sub" style={{ color: "#94a3b8" }}>
                Assuming {riskFreeRatePct}% Rf
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">WIN RATE & TRADES</div>
              <div className="metric-value font-mono">
                {backtestData.metrics.win_rate_pct}%
              </div>
              <div className="metric-sub" style={{ color: "#94a3b8" }}>
                {backtestData.metrics.winning_trades}W / {backtestData.metrics.losing_trades}L ({backtestData.metrics.total_trades} total)
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">TOTAL TRANSACTION FEES</div>
              <div className="metric-value font-mono text-warning">
                ${backtestData.metrics.total_transaction_costs}
              </div>
              <div className="metric-sub" style={{ color: "#94a3b8" }}>Slippage & commissions</div>
            </div>
          </div>

          {/* Equity Curve Chart */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 12 }}>
              <TrendingUp size={18} className="text-cyan" />
              Cumulative Equity Curve vs Buy & Hold Benchmark
            </h2>
            <EquityCurveChart equityCurve={backtestData.equity_curve} />
            <DrawdownChart equityCurve={backtestData.equity_curve} />
          </div>

          {/* Price Action with Crossover Indicators */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 12 }}>
              <LineChartIcon size={18} className="text-cyan" />
              Price with SMA Indicators Overlay (Short {shortWindow} vs Long {longWindow})
            </h2>
            <PriceChart
              data={backtestData.equity_curve}
              shortMa={shortWindow}
              longMa={longWindow}
              currency={metrics.currency}
            />
          </div>

          {/* Trade History Table */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Clock size={18} className="text-cyan" />
                Completed & Active Trades Log ({backtestData.trade_log.length} trades)
              </h2>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Entry Date</th>
                    <th>Exit Date</th>
                    <th>Entry Price</th>
                    <th>Exit Price</th>
                    <th>Shares</th>
                    <th>Net P&L ($)</th>
                    <th>Return %</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {backtestData.trade_log.map(t => {
                    const isWin = t.pnl > 0;
                    return (
                      <tr key={t.trade_id}>
                        <td style={{ fontWeight: 600 }}>#{t.trade_id}</td>
                        <td>{t.entry_date}</td>
                        <td>{t.exit_date}</td>
                        <td>${t.entry_price.toFixed(2)}</td>
                        <td>${t.exit_price.toFixed(2)}</td>
                        <td>{t.shares.toFixed(2)}</td>
                        <td style={{ fontWeight: 700 }} className={isWin ? "text-bullish" : "text-bearish"}>
                          {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}
                        </td>
                        <td className={isWin ? "text-bullish" : "text-bearish"}>
                          {t.return_pct >= 0 ? "+" : ""}{t.return_pct}%
                        </td>
                        <td style={{ color: "#94a3b8" }}>{t.duration_days} days</td>
                        <td>
                          <span className={`badge ${isWin ? "badge-win" : "badge-loss"}`}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
