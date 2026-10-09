import React, { useState } from "react";
import {
  FileText,
  Download,
  Printer,
  CheckCircle,
  AlertCircle,
  Database,
  TrendingUp,
  LineChart,
  ShieldCheck,
  ExternalLink
} from "lucide-react";
import { api, triggerDownload } from "../services/api";

export default function Reports({
  historicalData = [],
  metrics = {},
  forecastData = null,
  backtestData = null,
  preprocessingResult = null,
  dataSource = ""
}) {
  const [downloading, setDownloading] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);

  const handleDownload = async (exportType, filename) => {
    setDownloading(exportType);
    setStatusMsg(null);
    try {
      let payload = {};
      if (exportType === "historical") {
        payload = { records: historicalData };
      } else if (exportType === "predictions") {
        payload = {
          test_predictions: forecastData?.test_predictions || [],
          future_forecast: forecastData?.future_forecast || []
        };
      } else if (exportType === "trades") {
        payload = { trade_log: backtestData?.trade_log || [] };
      } else if (exportType === "metrics") {
        payload = {
          ticker: metrics.ticker,
          model_name: forecastData?.model_info?.name || "MLPRegressor",
          model_metrics: forecastData?.metrics || {},
          backtest_metrics: backtestData?.metrics || {}
        };
      } else if (exportType === "html_report") {
        payload = {
          ticker: metrics.ticker,
          company_name: metrics.company_name,
          data_source: dataSource,
          model_name: forecastData?.model_info?.name || "Multi-Layer Perceptron (MLPRegressor)",
          model_metrics: forecastData?.metrics || {},
          backtest_metrics: backtestData?.metrics || {},
          strategy_config: backtestData?.strategy || {}
        };
      }

      const blob = await api.exportReport(exportType, payload);
      triggerDownload(blob, filename);
      setStatusMsg(`Successfully downloaded ${filename}`);
    } catch (err) {
      alert("Download failed: " + err.message);
    } finally {
      setDownloading(null);
    }
  };

  const handlePrintHTML = async () => {
    try {
      const payload = {
        ticker: metrics.ticker,
        company_name: metrics.company_name,
        data_source: dataSource,
        model_name: forecastData?.model_info?.name || "Multi-Layer Perceptron (MLPRegressor)",
        model_metrics: forecastData?.metrics || {},
        backtest_metrics: backtestData?.metrics || {},
        strategy_config: backtestData?.strategy || {}
      };
      const blob = await api.exportReport("html_report", payload);
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      if (printWindow) {
        printWindow.focus();
      }
    } catch (err) {
      alert("Failed to open printable report: " + err.message);
    }
  };

  return (
    <div className="page-body">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FileText className="text-cyan" size={24} />
            Executive Reports & Quantitative Exports
          </h1>
          <p className="page-subtitle">
            Export reproducible data tables, model predictions, trade logs, and print an academic capstone technical report.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handlePrintHTML}>
          <Printer size={15} /> Open Printable Executive Report
        </button>
      </div>

      {statusMsg && (
        <div className="alert-banner alert-success">
          <CheckCircle size={18} style={{ flexShrink: 0 }} />
          <div>{statusMsg}</div>
        </div>
      )}

      {/* Overview Metadata Card */}
      <div className="card">
        <h2 className="card-title" style={{ marginBottom: 12 }}>
          <Database size={18} className="text-cyan" />
          Current Session Analysis Scope
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: "#64748b" }}>ASSET ANALYZED</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc" }}>
              {metrics.ticker} — {metrics.company_name}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: "#64748b" }}>DATA SOURCE</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#38bdf8" }}>
              {dataSource || "Standard Data"}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: "#64748b" }}>OBSERVATIONS RANGE</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#f8fafc" }}>
              {metrics.start_date || "—"} to {metrics.end_date || "—"} ({historicalData.length} records)
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: "#64748b" }}>FORECAST MODEL</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#10b981" }}>
              {forecastData?.model_info?.name || "Not Trained"}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: "#64748b" }}>BACKTEST STRATEGY</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#f59e0b" }}>
              {backtestData?.strategy?.name || "Not Executed"}
            </div>
          </div>
        </div>
      </div>

      {/* Download Action Cards */}
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
          Available Data Exports (CSV & HTML)
        </h3>

        <div className="grid-2">
          {/* Card 1: Historical Data */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 600, color: "#f8fafc" }}>
                  1. Cleaned Historical Market Data
                </h4>
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                  Full OHLCV dataset including Open, High, Low, Close, Adjusted Close, and Volume across the analysis period.
                </p>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
                  Total rows: {historicalData.length} records
                </div>
              </div>

              <button
                className="btn btn-secondary"
                disabled={downloading !== null || historicalData.length === 0}
                onClick={() => handleDownload("historical", `${metrics.ticker}_historical_data.csv`)}
              >
                <Download size={14} /> CSV
              </button>
            </div>
          </div>

          {/* Card 2: Predictions */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 600, color: "#f8fafc" }}>
                  2. Predictions & Future Projections
                </h4>
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                  Out-of-sample test actuals vs predictions, residual errors, plus multi-step future price forecasts.
                </p>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
                  Status: {forecastData ? `${forecastData.future_forecast?.length} future steps` : "Model not trained"}
                </div>
              </div>

              <button
                className="btn btn-secondary"
                disabled={downloading !== null || !forecastData}
                onClick={() => handleDownload("predictions", `${metrics.ticker}_predictions.csv`)}
              >
                <Download size={14} /> CSV
              </button>
            </div>
          </div>

          {/* Card 3: Trades */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 600, color: "#f8fafc" }}>
                  3. Backtesting Trade History Log
                </h4>
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                  All executed long trades with entry date, exit date, fill prices, transaction commissions, duration, and net P&L.
                </p>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
                  Status: {backtestData ? `${backtestData.trade_log?.length} trades recorded` : "Backtest not executed"}
                </div>
              </div>

              <button
                className="btn btn-secondary"
                disabled={downloading !== null || !backtestData}
                onClick={() => handleDownload("trades", `${metrics.ticker}_trade_log.csv`)}
              >
                <Download size={14} /> CSV
              </button>
            </div>
          </div>

          {/* Card 4: Metrics */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 600, color: "#f8fafc" }}>
                  4. Consolidated Performance Metrics
                </h4>
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                  Summary table of all statistical metrics (MAE, RMSE, MAPE, R²) and quantitative trading metrics (CAGR, Max DD, Sharpe, Alpha).
                </p>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
                  Suitable for academic project documentation & comparison tables
                </div>
              </div>

              <button
                className="btn btn-secondary"
                disabled={downloading !== null}
                onClick={() => handleDownload("metrics", `${metrics.ticker}_performance_metrics.csv`)}
              >
                <Download size={14} /> CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Report Preview */}
      <div className="card" style={{ background: "#0b1120" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc" }}>
              Printable Technical Summary Document (HTML / PDF)
            </h4>
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
              Generates a beautifully styled, college-ready academic capstone document that can be directly saved as PDF via browser print (Ctrl+P).
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn btn-primary"
              onClick={() => handleDownload("html_report", `StockVision_${metrics.ticker}_Report.html`)}
            >
              <Download size={15} /> Download HTML File
            </button>
            <button className="btn btn-outline-cyan" onClick={handlePrintHTML}>
              <ExternalLink size={15} /> Open & Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
