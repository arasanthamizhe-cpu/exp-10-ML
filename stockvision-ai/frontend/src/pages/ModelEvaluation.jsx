import React from "react";
import ForecastChart from "../charts/ForecastChart";
import ResidualChart from "../charts/ResidualChart";
import {
  Award,
  BarChart2,
  AlertTriangle,
  Info,
  CheckCircle,
  HelpCircle,
  GitBranch,
  ArrowRight
} from "lucide-react";

export default function ModelEvaluation({
  forecastData = null,
  metrics = {},
  setCurrentPage
}) {
  if (!forecastData || !forecastData.metrics) {
    return (
      <div className="page-body">
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <Award className="text-cyan" size={24} />
              Model Evaluation & Residual Diagnostics
            </h1>
            <p className="page-subtitle">
              Comprehensive statistical evaluation of time-series regressions and out-of-sample error distribution.
            </p>
          </div>
        </div>

        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <HelpCircle size={44} style={{ color: "#64748b", margin: "0 auto 16px auto" }} />
          <h3 style={{ fontSize: 18, color: "#f8fafc", marginBottom: 8 }}>
            No Forecasting Model Evaluated Yet
          </h3>
          <p style={{ color: "#94a3b8", maxWidth: 500, margin: "0 auto 20px auto", fontSize: 13 }}>
            To view residual error distributions, baseline comparisons, and statistical metrics, train a model in the Forecasting module first.
          </p>
          <button className="btn btn-primary" onClick={() => setCurrentPage("forecasting")}>
            Go to ML Forecasting Module &rarr;
          </button>
        </div>
      </div>
    );
  }

  const { metrics: m, baselines, config, model_info } = forecastData;

  return (
    <div className="page-body">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Award className="text-cyan" size={24} />
            Model Evaluation & Residual Diagnostics
          </h1>
          <p className="page-subtitle">
            Out-of-sample statistical metrics, residual error decomposition, and baseline benchmark comparisons.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setCurrentPage("reports")}>
          Generate Full Technical Report <ArrowRight size={15} />
        </button>
      </div>

      {/* Primary Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">MEAN ABSOLUTE ERROR (MAE)</div>
          <div className="metric-value font-mono">{m.mae}</div>
          <div className="metric-sub" style={{ color: "#94a3b8" }}>
            Real price deviation ($/₹)
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">ROOT MEAN SQUARED ERROR</div>
          <div className="metric-value font-mono">{m.rmse}</div>
          <div className="metric-sub" style={{ color: "#94a3b8" }}>
            L2 quadratic error penalty
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">MEAN ABSOLUTE PCT ERROR</div>
          <div className="metric-value font-mono">{m.mape}%</div>
          <div className="metric-sub" style={{ color: "#94a3b8" }}>
            Relative scale-independent error
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">R-SQUARED COEFFICIENT (R²)</div>
          <div className="metric-value font-mono" style={{ color: m.r2_score >= 0 ? "#10b981" : "#f43f5e" }}>
            {m.r2_score}
          </div>
          <div className="metric-sub" style={{ color: "#94a3b8" }}>
            Proportion of variance explained
          </div>
        </div>
      </div>

      {/* Model vs Baseline Benchmarks Table */}
      <div className="card">
        <h2 className="card-title" style={{ marginBottom: 12 }}>
          <GitBranch size={18} className="text-cyan" />
          Benchmark Comparison: Model vs Naïve Baselines
        </h2>
        <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 14 }}>
          In financial markets, the previous day's closing price (Naïve t-1) is a strong statistical baseline. A valid ML model must demonstrate competitive or superior predictive signal over simple persistence.
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Model / Baseline Approach</th>
                <th>MAE ($/₹)</th>
                <th>RMSE ($/₹)</th>
                <th>Relative Performance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700, color: "#38bdf8" }}>
                  Active Model: {model_info?.name || config.model_type}
                </td>
                <td style={{ fontWeight: 700 }}>{m.mae}</td>
                <td style={{ fontWeight: 700 }}>{m.rmse}</td>
                <td>
                  <span className="badge badge-win">Current Model</span>
                </td>
              </tr>
              {baselines?.naive && (
                <tr>
                  <td>Naïve Persistence (Previous Close y(t-1))</td>
                  <td>{baselines.naive.mae}</td>
                  <td>{baselines.naive.rmse}</td>
                  <td style={{ color: "#94a3b8" }}>
                    {m.mae < baselines.naive.mae ? (
                      <span className="text-bullish font-mono">
                        Model beats Naïve by {((baselines.naive.mae - m.mae) / baselines.naive.mae * 100).toFixed(1)}%
                      </span>
                    ) : (
                      <span style={{ color: "#f59e0b" }}>Persistence baseline comparable</span>
                    )}
                  </td>
                </tr>
              )}
              {baselines?.sma && (
                <tr>
                  <td>Simple Moving Average (Window {config.lookback_window})</td>
                  <td>{baselines.sma.mae}</td>
                  <td>{baselines.sma.rmse}</td>
                  <td style={{ color: "#94a3b8" }}>
                    {m.mae < baselines.sma.mae ? (
                      <span className="text-bullish font-mono">
                        Model beats SMA by {((baselines.sma.mae - m.mae) / baselines.sma.mae * 100).toFixed(1)}%
                      </span>
                    ) : (
                      <span style={{ color: "#f59e0b" }}>SMA comparable</span>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visualizations: Out of Sample Predictions & Residual Chart */}
      <div className="grid-2">
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: 12 }}>
            <BarChart2 size={16} className="text-cyan" />
            Out-of-Sample Predictions vs Actual
          </h2>
          <ForecastChart
            testPredictions={forecastData.test_predictions}
            currency={metrics.currency}
          />
        </div>

        <div className="card">
          <h2 className="card-title" style={{ marginBottom: 12 }}>
            <BarChart2 size={16} style={{ color: "#f59e0b" }} />
            Residual Error Decomposition (e = y - ŷ)
          </h2>
          <ResidualChart residuals={forecastData.residuals} />
        </div>
      </div>

      {/* Academic Explanations & Theory */}
      <div className="grid-3">
        <div className="card" style={{ background: "#0b1222" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#38bdf8", marginBottom: 8 }}>
            Accuracy vs Trading Performance
          </h3>
          <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
            Regression metrics (MAE, RMSE, R²) measure distance between price levels. However, a model can have high R² while failing at market timing. Trading profitability relies on directional accuracy and timing volatility expansions, not just tracking lagged price levels.
          </p>
        </div>

        <div className="card" style={{ background: "#0b1222" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#10b981", marginBottom: 8 }}>
            Data Leakage Elimination
          </h3>
          <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
            Financial time-series data exhibits temporal dependency. Random cross-validation shuffles future data into training sets, causing catastrophic data leakage. Here, strictly chronological sequence splits are used, fitting scalers exclusively on past training data.
          </p>
        </div>

        <div className="card" style={{ background: "#0b1222" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b", marginBottom: 8 }}>
            Look-Ahead Bias Safeguards
          </h3>
          <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
            To ensure genuine out-of-sample fidelity, signals computed at Day t close are executed with a one-period delay on Day t+1. This mirrors realistic electronic trading execution where market orders cannot execute instantaneously at the signal computation timestamp.
          </p>
        </div>
      </div>
    </div>
  );
}
