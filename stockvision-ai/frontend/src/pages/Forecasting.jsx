import React, { useState } from "react";
import ForecastChart from "../charts/ForecastChart";
import {
  TrendingUp,
  Zap,
  Download,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  Cpu,
  BarChart2,
  Calendar,
  ArrowRight
} from "lucide-react";
import { api, triggerDownload } from "../services/api";

export default function Forecasting({
  historicalData = [],
  preprocessedData = [],
  forecastData = null,
  setForecastData,
  metrics = {},
  setCurrentPage
}) {
  const [modelType, setModelType] = useState("MLP");
  const [lookbackWindow, setLookbackWindow] = useState(30);
  const [forecastHorizon, setForecastHorizon] = useState(5);
  const [targetColumn, setTargetColumn] = useState("Close");
  const [trainSplitRatio, setTrainSplitRatio] = useState(0.8);
  const [scalerType, setScalerType] = useState("minmax");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const modelDescriptions = {
    MLP: {
      name: "Multi-Layer Perceptron (MLPRegressor)",
      family: "Deep Feedforward Neural Network",
      notes: "Lightweight scikit-learn neural network with hidden layers (64, 32), ReLU activation, Adam optimizer, and early stopping. Fast, non-linear, and runs locally on any environment without heavy TensorFlow overhead.",
      limitation: "Note: This is an MLP feedforward architecture, NOT an LSTM recurrent network. Inputs are fixed sliding lag windows."
    },
    LinearRegression: {
      name: "Linear Regression (OLS)",
      family: "Linear Parametric",
      notes: "Standard Ordinary Least Squares linear regression fitting a hyper-plane over historical lag prices.",
      limitation: "Cannot capture non-linear market regimes or volatility clustering."
    },
    Ridge: {
      name: "Ridge Regression (L2)",
      family: "Regularized Linear",
      notes: "L2 regularized linear model penalizing large regression coefficients to mitigate collinearity among consecutive lags.",
      limitation: "Still constrained to linear response surfaces."
    },
    RandomForest: {
      name: "Random Forest Regressor",
      family: "Ensemble Decision Trees",
      notes: "100 bagged decision trees with depth limiting to capture non-linear price thresholds without severe overfitting.",
      limitation: "Cannot extrapolate prices above historical maximums or below historical minimums."
    },
    SMA_Baseline: {
      name: "Simple Moving Average (Baseline)",
      family: "Statistical Moving Average",
      notes: "Calculates the rolling mean of the lookback window as a benchmark comparison.",
      limitation: "Lagging indicator that does not dynamically adjust to price momentum."
    }
  };

  const activeModelMeta = modelDescriptions[modelType] || modelDescriptions.MLP;

  const handleTrainAndForecast = async () => {
    const dataToUse = (preprocessedData && preprocessedData.length > 0) ? preprocessedData : historicalData;
    if (!dataToUse || dataToUse.length === 0) {
      setError("Please load stock data from the Explorer before running model training.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.trainAndForecast({
        records: dataToUse,
        model_type: modelType,
        lookback_window: Number(lookbackWindow),
        forecast_horizon: Number(forecastHorizon),
        target_column: targetColumn,
        train_split_ratio: Number(trainSplitRatio),
        scaler_type: scalerType
      });
      setForecastData(res);
    } catch (err) {
      setError(err.message || "Model training failed");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!forecastData) return;
    try {
      const blob = await api.exportReport("predictions", {
        test_predictions: forecastData.test_predictions,
        future_forecast: forecastData.future_forecast
      });
      triggerDownload(blob, `${metrics.ticker || "stock"}_forecast_predictions.csv`);
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
            <TrendingUp className="text-cyan" size={24} />
            Machine Learning Forecasting Engine
          </h1>
          <p className="page-subtitle">
            Train non-linear neural networks and statistical models chronologically to project out-of-sample and future price curves.
          </p>
        </div>

        {forecastData?.success && (
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-secondary" onClick={handleExportCSV}>
              <Download size={15} /> Export Forecast CSV
            </button>
            <button className="btn btn-primary" onClick={() => setCurrentPage("evaluation")}>
              View Evaluation Metrics <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Advisory Banner */}
      <div className="alert-banner alert-info">
        <HelpCircle size={18} style={{ flexShrink: 0 }} />
        <div>
          <strong>MODEL INTEGRITY NOTICE:</strong> Preprocessing scalers are fitted exclusively on chronological training sequences. No random shuffling or test set contamination occurs.
          Forecasts are quantitative estimates based on lag correlations and do not constitute investment advice.
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-danger">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div>{error}</div>
        </div>
      )}

      {/* Model Configuration Form */}
      <div className="card">
        <h2 className="card-title" style={{ marginBottom: 14 }}>
          <Cpu size={18} className="text-cyan" />
          Model Architecture & Training Hyperparameters
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Forecasting Algorithm</label>
            <select
              className="select"
              value={modelType}
              onChange={e => setModelType(e.target.value)}
            >
              <option value="MLP">Multi-Layer Perceptron (MLPRegressor) [Primary]</option>
              <option value="RandomForest">Random Forest Regressor (100 Trees)</option>
              <option value="LinearRegression">Linear Regression (OLS)</option>
              <option value="Ridge">Ridge Regression (L2 Regularized)</option>
              <option value="SMA_Baseline">Simple Moving Average (Baseline)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Lookback Window (W)</label>
            <select
              className="select"
              value={lookbackWindow}
              onChange={e => setLookbackWindow(Number(e.target.value))}
            >
              <option value="15">15 Lag Observations</option>
              <option value="30">30 Lag Observations (Standard)</option>
              <option value="45">45 Lag Observations</option>
              <option value="60">60 Lag Observations</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Forecast Horizon (H)</label>
            <select
              className="select"
              value={forecastHorizon}
              onChange={e => setForecastHorizon(Number(e.target.value))}
            >
              <option value="1">1 Business Day Ahead</option>
              <option value="5">5 Business Days Ahead (1 Week)</option>
              <option value="10">10 Business Days Ahead (2 Weeks)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Train / Test Split Ratio</label>
            <select
              className="select"
              value={trainSplitRatio}
              onChange={e => setTrainSplitRatio(Number(e.target.value))}
            >
              <option value="0.7">70% Train / 30% Test</option>
              <option value="0.8">80% Train / 20% Test (Standard)</option>
              <option value="0.85">85% Train / 15% Test</option>
            </select>
          </div>
        </div>

        {/* Model Transparency Info Box */}
        <div style={{ background: "#0b1222", border: "1px solid #1e293b", padding: 14, borderRadius: 8, marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8" }}>
            {activeModelMeta.name} — <span style={{ color: "#94a3b8", fontWeight: 400 }}>{activeModelMeta.family}</span>
          </div>
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
            {activeModelMeta.notes}
          </p>
          <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 6, fontWeight: 500 }}>
            &#9888; Limitation: {activeModelMeta.limitation}
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <button
            className="btn btn-primary"
            onClick={handleTrainAndForecast}
            disabled={loading}
          >
            <Zap size={15} /> {loading ? "Training Neural Network..." : "Train Model & Generate Forecast"}
          </button>
        </div>
      </div>

      {/* Forecast Output and Charts */}
      {forecastData && (
        <>
          {/* Key Out-of-Sample Metrics Cards */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">MEAN ABSOLUTE ERROR (MAE)</div>
              <div className="metric-value">{forecastData.metrics.mae}</div>
              <div className="metric-sub" style={{ color: "#94a3b8" }}>Average dollar error</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">ROOT MEAN SQUARED ERROR</div>
              <div className="metric-value">{forecastData.metrics.rmse}</div>
              <div className="metric-sub" style={{ color: "#94a3b8" }}>Penalizes large errors</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">MEAN ABSOLUTE PCT ERROR</div>
              <div className="metric-value">{forecastData.metrics.mape}%</div>
              <div className="metric-sub" style={{ color: "#94a3b8" }}>Relative error rate</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">DIRECTIONAL HIT RATE</div>
              <div className="metric-value" style={{ color: forecastData.metrics.directional_accuracy_pct >= 50 ? "#10b981" : "#f43f5e" }}>
                {forecastData.metrics.directional_accuracy_pct}%
              </div>
              <div className="metric-sub" style={{ color: "#94a3b8" }}>Up/down sign accuracy</div>
            </div>
          </div>

          {/* Interactive Forecast Chart */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 12 }}>
              <BarChart2 size={18} className="text-cyan" />
              Actual Observations vs Out-of-Sample Predictions & Projected Horizon
            </h2>
            <ForecastChart
              testPredictions={forecastData.test_predictions}
              futureForecast={forecastData.future_forecast}
              currency={metrics.currency}
            />
          </div>

          {/* Future Forecast Horizon Table */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 12 }}>
              <Calendar size={18} className="text-cyan" />
              Multi-Step Future Price Projections (Next {forecastData.future_forecast.length} Trading Days)
            </h2>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Step</th>
                    <th>Future Date</th>
                    <th>Predicted Close Price</th>
                    <th>Expected Delta from Latest Close</th>
                  </tr>
                </thead>
                <tbody>
                  {forecastData.future_forecast.map((f, i) => {
                    const diff = metrics.latest_price ? f.predicted_price - metrics.latest_price : 0;
                    const diffPct = metrics.latest_price ? (diff / metrics.latest_price) * 100 : 0;
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>T + {f.horizon_step}</td>
                        <td style={{ color: "#f8fafc" }}>{f.date}</td>
                        <td style={{ fontWeight: 700, color: "#38bdf8", fontFamily: "JetBrains Mono" }}>
                          {metrics.currency === "INR" ? "₹" : "$"}{f.predicted_price.toFixed(2)}
                        </td>
                        <td>
                          <span className={diff >= 0 ? "text-bullish" : "text-bearish"} style={{ fontWeight: 600 }}>
                            {diff >= 0 ? "+" : ""}{diff.toFixed(2)} ({diffPct >= 0 ? "+" : ""}{diffPct.toFixed(2)}%)
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
