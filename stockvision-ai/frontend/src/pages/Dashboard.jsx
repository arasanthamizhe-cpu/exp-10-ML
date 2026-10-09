import React from "react";
import PriceChart from "../charts/PriceChart";
import {
  DollarSign,
  TrendingUp,
  Activity,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ShieldAlert,
  Zap,
  Sliders,
  Award,
  FileText
} from "lucide-react";

export default function Dashboard({
  metrics = {},
  historicalData = [],
  forecastData = null,
  backtestData = null,
  setCurrentPage,
  dataSource = ""
}) {
  const isSample = dataSource && dataSource.toUpperCase().includes("SAMPLE");

  // Determine forecast next day price
  let nextDayForecast = "—";
  let forecastChange = null;
  if (forecastData && forecastData.future_forecast && forecastData.future_forecast.length > 0) {
    const nextItem = forecastData.future_forecast[0];
    nextDayForecast = `${metrics.currency === "INR" ? "₹" : "$"}${nextItem.predicted_price.toFixed(2)}`;
    if (metrics.latest_price) {
      forecastChange = ((nextItem.predicted_price - metrics.latest_price) / metrics.latest_price) * 100;
    }
  }

  // Determine backtest strategy return
  let strategyReturn = "—";
  let alphaVal = null;
  if (backtestData && backtestData.metrics) {
    strategyReturn = `${backtestData.metrics.total_strategy_return_pct >= 0 ? "+" : ""}${backtestData.metrics.total_strategy_return_pct}%`;
    alphaVal = backtestData.metrics.alpha_pct;
  }

  return (
    <div className="page-body">
      {isSample && (
        <div className="alert-banner alert-warning">
          <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>SAMPLE DATA MODE:</strong> You are currently exploring offline sample data.
            All metrics, indicators, and machine learning models run reproducibly on this synthetic dataset.
            To connect to live Yahoo Finance data, visit the <strong>Stock Data Explorer</strong> page.
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Activity className="text-cyan" size={24} />
            Executive Financial Analytics Dashboard
          </h1>
          <p className="page-subtitle">
            Algorithmic quant platform combining time-series machine learning forecasting and systematic backtesting.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setCurrentPage("explorer")}>
            Switch Asset
          </button>
          <button className="btn btn-primary" onClick={() => setCurrentPage("forecasting")}>
            <Zap size={15} /> Run ML Forecast
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">
            <span>LATEST ASSET PRICE</span>
            <DollarSign size={16} className="text-cyan" />
          </div>
          <div className="metric-value">
            {metrics.latest_price ? `${metrics.currency === "INR" ? "₹" : "$"}${metrics.latest_price.toFixed(2)}` : "—"}
          </div>
          <div className="metric-sub">
            {metrics.pct_change !== undefined && (
              <span className={metrics.pct_change >= 0 ? "text-bullish" : "text-bearish"} style={{ display: "flex", alignItems: "center" }}>
                {metrics.pct_change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {metrics.pct_change >= 0 ? "+" : ""}{metrics.pct_change}% ({metrics.price_change >= 0 ? "+" : ""}{metrics.price_change})
              </span>
            )}
            <span style={{ color: "#64748b", marginLeft: "auto", fontSize: 11 }}>
              {metrics.latest_date || "Today"}
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            <span>ANNUALIZED VOLATILITY</span>
            <Activity size={16} style={{ color: "#f59e0b" }} />
          </div>
          <div className="metric-value">
            {metrics.historical_volatility ? `${metrics.historical_volatility}%` : "—"}
          </div>
          <div className="metric-sub">
            <span style={{ color: "#94a3b8" }}>
              52W Range: {metrics.currency === "INR" ? "₹" : "$"}{metrics.low_52w || "—"} - {metrics.currency === "INR" ? "₹" : "$"}{metrics.high_52w || "—"}
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            <span>NEXT-DAY ML FORECAST</span>
            <TrendingUp size={16} className="text-cyan" />
          </div>
          <div className="metric-value">
            {nextDayForecast}
          </div>
          <div className="metric-sub">
            {forecastChange !== null ? (
              <span className={forecastChange >= 0 ? "text-bullish" : "text-bearish"}>
                {forecastChange >= 0 ? "+" : ""}{forecastChange.toFixed(2)}% vs Current
              </span>
            ) : (
              <span style={{ color: "#64748b" }}>Model training required</span>
            )}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            <span>STRATEGY RETURN</span>
            <LineChart size={16} className="text-bullish" />
          </div>
          <div className="metric-value" style={{ color: strategyReturn.startsWith("+") ? "#10b981" : strategyReturn.startsWith("-") ? "#f43f5e" : "#f8fafc" }}>
            {strategyReturn}
          </div>
          <div className="metric-sub">
            {alphaVal !== null ? (
              <span className={alphaVal >= 0 ? "text-bullish" : "text-bearish"}>
                Alpha: {alphaVal >= 0 ? "+" : ""}{alphaVal}% vs Buy&Hold
              </span>
            ) : (
              <span style={{ color: "#64748b" }}>SMA Crossover Backtest</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Interactive Price Chart */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <LineChart size={18} className="text-cyan" />
              Historical Price Action & Technical Trends
            </h2>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              {metrics.ticker} &bull; {metrics.company_name} &bull; {historicalData.length} Daily Observations
            </div>
          </div>
          <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={() => setCurrentPage("explorer")}>
            Full Data Table &rarr;
          </button>
        </div>

        <PriceChart data={historicalData} currency={metrics.currency} />
      </div>

      {/* Quick Action Navigation Modules */}
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: "#f8fafc" }}>
          Platform Workflow Modules
        </h3>
        <div className="grid-2">
          <div className="card" style={{ cursor: "pointer", transition: "all 0.2s" }} onClick={() => setCurrentPage("preprocessing")}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ background: "rgba(56, 189, 248, 0.12)", color: "#38bdf8", padding: 10, borderRadius: 8 }}>
                  <Sliders size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: "#f8fafc" }}>Data Preprocessing</h4>
                  <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                    Audit missing values, execute chronological sort, and construct sliding time-series windows.
                  </p>
                </div>
              </div>
              <ChevronRight size={18} style={{ color: "#64748b" }} />
            </div>
          </div>

          <div className="card" style={{ cursor: "pointer", transition: "all 0.2s" }} onClick={() => setCurrentPage("forecasting")}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981", padding: 10, borderRadius: 8 }}>
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: "#f8fafc" }}>Machine Learning Forecasting</h4>
                  <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                    Train neural networks (MLPRegressor) and project future 1 to 10-day price trajectories.
                  </p>
                </div>
              </div>
              <ChevronRight size={18} style={{ color: "#64748b" }} />
            </div>
          </div>

          <div className="card" style={{ cursor: "pointer", transition: "all 0.2s" }} onClick={() => setCurrentPage("backtesting")}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", padding: 10, borderRadius: 8 }}>
                  <LineChart size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: "#f8fafc" }}>Strategy Backtesting</h4>
                  <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                    Simulate SMA crossover rules with execution lag and realistic transaction commissions.
                  </p>
                </div>
              </div>
              <ChevronRight size={18} style={{ color: "#64748b" }} />
            </div>
          </div>

          <div className="card" style={{ cursor: "pointer", transition: "all 0.2s" }} onClick={() => setCurrentPage("reports")}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ background: "rgba(148, 163, 184, 0.12)", color: "#94a3b8", padding: 10, borderRadius: 8 }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: "#f8fafc" }}>Executive Reports & CSVs</h4>
                  <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                    Download forecasts, trade histories, and generate academic summary reports.
                  </p>
                </div>
              </div>
              <ChevronRight size={18} style={{ color: "#64748b" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
