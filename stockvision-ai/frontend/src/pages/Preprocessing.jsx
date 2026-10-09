import React, { useState } from "react";
import {
  Sliders,
  CheckCircle,
  AlertTriangle,
  Play,
  ArrowRight,
  Database,
  Layers,
  ShieldCheck,
  FileSpreadsheet
} from "lucide-react";
import { api } from "../services/api";

export default function Preprocessing({
  historicalData = [],
  preprocessedData = [],
  setPreprocessedData,
  preprocessingResult = null,
  setPreprocessingResult,
  setCurrentPage
}) {
  const [missingPolicy, setMissingPolicy] = useState("forward_fill");
  const [scalerType, setScalerType] = useState("minmax");
  const [lookbackWindow, setLookbackWindow] = useState(30);
  const [forecastHorizon, setForecastHorizon] = useState(5);
  const [targetColumn, setTargetColumn] = useState("Close");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRunPreprocessing = async () => {
    if (!historicalData || historicalData.length === 0) {
      setError("Please load stock data from the Explorer before running preprocessing.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.preprocessData({
        records: historicalData,
        missing_policy: missingPolicy,
        scaler_type: scalerType,
        lookback_window: Number(lookbackWindow),
        forecast_horizon: Number(forecastHorizon),
        target_column: targetColumn
      });
      setPreprocessingResult(res);
      setPreprocessedData(res.cleaned_data);
    } catch (err) {
      setError(err.message || "Preprocessing failed");
    } finally {
      setLoading(false);
    }
  };

  const steps = preprocessingResult?.pipeline_steps || [
    { step: 1, name: "Raw Ingestion", description: "Verify dataset presence and column schema.", status: "PENDING" },
    { step: 2, name: "Schema Validation", description: "Validate presence of Date, Open, High, Low, Close, Volume.", status: "PENDING" },
    { step: 3, name: "Type Conversion", description: "Cast timestamps to ISO strings and prices to numeric float64.", status: "PENDING" },
    { step: 4, name: "Chronological Sorting", description: "Sort strictly ascending by Date without random shuffling.", status: "PENDING" },
    { step: 5, name: "Duplicate & Missing Audit", description: "Audit duplicate timestamps and calculate missing counts.", status: "PENDING" },
    { step: 6, name: "Missing Data Policy", description: "Execute selected imputation policy with record audit log.", status: "PENDING" },
    { step: 7, name: "Normalization / Scaling", description: "Fit feature normalizer strictly on training sequences.", status: "PENDING" },
    { step: 8, name: "Sliding Window Formulation", description: "Slice observations into lookback window (W) and horizon (H) samples.", status: "PENDING" }
  ];

  return (
    <div className="page-body">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Sliders className="text-cyan" size={24} />
            Data Preprocessing & Validation Pipeline
          </h1>
          <p className="page-subtitle">
            Execute rigorous 8-stage time-series preprocessing, prevent data leakage, and construct sliding sequence matrices.
          </p>
        </div>

        {preprocessingResult?.success && (
          <button className="btn btn-primary" onClick={() => setCurrentPage("forecasting")}>
            Proceed to Model Training <ArrowRight size={15} />
          </button>
        )}
      </div>

      {error && (
        <div className="alert-banner alert-danger">
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <div>{error}</div>
        </div>
      )}

      {/* Configuration Controls Card */}
      <div className="card">
        <h2 className="card-title" style={{ marginBottom: 14 }}>
          <Sliders size={18} className="text-cyan" />
          Pipeline Parameters
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Missing Data Policy</label>
            <select
              className="select"
              value={missingPolicy}
              onChange={e => setMissingPolicy(e.target.value)}
            >
              <option value="forward_fill">Forward-Fill (ffill + bfill) [Recommended]</option>
              <option value="backward_fill">Backward-Fill (bfill + ffill)</option>
              <option value="drop">Drop Incomplete Rows</option>
            </select>
            <span style={{ fontSize: 11, color: "#64748b" }}>
              Preserves chronological sequence continuity
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Feature Scaler</label>
            <select
              className="select"
              value={scalerType}
              onChange={e => setScalerType(e.target.value)}
            >
              <option value="minmax">MinMaxScaler [0, 1] (Bounded Neural Input)</option>
              <option value="standard">StandardScaler (Zero Mean, Unit Variance)</option>
            </select>
            <span style={{ fontSize: 11, color: "#64748b" }}>
              Fitted strictly on train slice only
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Lookback Window (W)</label>
            <select
              className="select"
              value={lookbackWindow}
              onChange={e => setLookbackWindow(Number(e.target.value))}
            >
              <option value="15">15 Trading Days</option>
              <option value="30">30 Trading Days (Standard)</option>
              <option value="60">60 Trading Days (Quarterly)</option>
              <option value="90">90 Trading Days</option>
            </select>
            <span style={{ fontSize: 11, color: "#64748b" }}>
              Number of past observations per sequence
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Forecast Horizon (H)</label>
            <select
              className="select"
              value={forecastHorizon}
              onChange={e => setForecastHorizon(Number(e.target.value))}
            >
              <option value="1">1 Day Ahead (Next Session)</option>
              <option value="5">5 Days Ahead (1 Trading Week)</option>
              <option value="10">10 Days Ahead (2 Trading Weeks)</option>
            </select>
            <span style={{ fontSize: 11, color: "#64748b" }}>
              Future steps projected into the future
            </span>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <button
            className="btn btn-primary"
            onClick={handleRunPreprocessing}
            disabled={loading || historicalData.length === 0}
          >
            <Play size={15} /> {loading ? "Running Pipeline..." : "Execute 8-Step Preprocessing Pipeline"}
          </button>
        </div>
      </div>

      {/* 8-Stage Progress Cards */}
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
          Chronological Pipeline Stages
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
          {steps.map(s => {
            const isPassed = s.status === "PASSED";
            return (
              <div
                key={s.step}
                className="card"
                style={{
                  padding: 14,
                  borderColor: isPassed ? "rgba(16, 185, 129, 0.3)" : "#1e293b",
                  background: isPassed ? "rgba(15, 23, 42, 0.9)" : "var(--bg-card)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>
                    STAGE {s.step}
                  </span>
                  <span
                    className={`badge ${isPassed ? "badge-win" : "badge-neutral"}`}
                    style={{ fontSize: 10 }}
                  >
                    {s.status}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc" }}>
                  {s.name}
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, lineHeight: 1.4 }}>
                  {s.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pipeline Audit Summary */}
      {preprocessingResult?.audit && (
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: 14 }}>
            <ShieldCheck size={18} className="text-bullish" />
            Audit & Transformation Metrics
          </h2>

          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">INITIAL RAW RECORDS</div>
              <div className="metric-value">{preprocessingResult.audit.initial_rows}</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">FINAL CLEANED RECORDS</div>
              <div className="metric-value">{preprocessingResult.audit.final_rows}</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">DUPLICATES REMOVED</div>
              <div className="metric-value">{preprocessingResult.audit.duplicates_removed}</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">GENERATED SLIDING WINDOWS</div>
              <div className="metric-value">{preprocessingResult.audit.total_sliding_windows}</div>
              <div className="metric-sub" style={{ color: "#38bdf8" }}>
                W = {preprocessingResult.audit.lookback_window}, H = {preprocessingResult.audit.forecast_horizon}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Before and After Inspection Tables */}
      {preprocessingResult && (
        <div className="grid-2">
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 12 }}>
              <FileSpreadsheet size={16} style={{ color: "#f59e0b" }} />
              Before Preprocessing (First 5 records)
            </h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Open</th>
                    <th>High</th>
                    <th>Low</th>
                    <th>Close</th>
                    <th>Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {preprocessingResult.before_sample?.map((r, i) => (
                    <tr key={i}>
                      <td>{r.Date}</td>
                      <td>{Number(r.Open).toFixed(2)}</td>
                      <td>{Number(r.High).toFixed(2)}</td>
                      <td>{Number(r.Low).toFixed(2)}</td>
                      <td>{Number(r.Close).toFixed(2)}</td>
                      <td>{Number(r.Volume).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 12 }}>
              <FileSpreadsheet size={16} className="text-bullish" />
              After Preprocessing (First 5 records)
            </h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Open</th>
                    <th>High</th>
                    <th>Low</th>
                    <th>Close</th>
                    <th>Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {preprocessingResult.after_sample?.map((r, i) => (
                    <tr key={i}>
                      <td>{r.Date}</td>
                      <td>{Number(r.Open).toFixed(2)}</td>
                      <td>{Number(r.High).toFixed(2)}</td>
                      <td>{Number(r.Low).toFixed(2)}</td>
                      <td style={{ color: "#38bdf8", fontWeight: 700 }}>{Number(r.Close).toFixed(2)}</td>
                      <td>{Number(r.Volume).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
