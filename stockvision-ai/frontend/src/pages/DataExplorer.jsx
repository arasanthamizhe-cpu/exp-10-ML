import React, { useState } from "react";
import PriceChart from "../charts/PriceChart";
import VolumeChart from "../charts/VolumeChart";
import {
  Database,
  Search,
  UploadCloud,
  Download,
  AlertCircle,
  CheckCircle,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { api, triggerDownload } from "../services/api";

export default function DataExplorer({
  historicalData = [],
  setHistoricalData,
  metrics = {},
  setMetrics,
  dataSource = "",
  setDataSource,
  setCurrentPage
}) {
  const [tickerInput, setTickerInput] = useState(metrics.ticker || "AAPL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [interval, setInterval] = useState("1d");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Table pagination & search
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const pageSize = 15;

  const quickTickers = [
    { sym: "AAPL", name: "Apple" },
    { sym: "MSFT", name: "Microsoft" },
    { sym: "GOOGL", name: "Alphabet" },
    { sym: "NVDA", name: "Nvidia" },
    { sym: "RELIANCE.NS", name: "Reliance" },
    { sym: "TCS.NS", name: "TCS" }
  ];

  const handleFetchData = async (forceSample = false) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.loadStockData({
        ticker: tickerInput,
        startDate: startDate || null,
        endDate: endDate || null,
        interval,
        forceSample
      });
      setHistoricalData(res.data);
      setMetrics(res.metrics);
      setDataSource(res.source);
      if (res.fallback_notice) {
        setSuccessMsg(res.fallback_notice);
      } else {
        setSuccessMsg(`Successfully loaded ${res.data.length} records for ${res.metrics.ticker}.`);
      }
      setCurrentPageNum(1);
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.uploadCSV(file);
      setHistoricalData(res.data);
      setMetrics(res.metrics);
      setDataSource(res.source);
      setSuccessMsg(`Uploaded and processed ${file.name} (${res.data.length} observations).`);
      setCurrentPageNum(1);
    } catch (err) {
      setError(err.message || "Failed to upload CSV");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleDownloadHistorical = async () => {
    try {
      const blob = await api.exportReport("historical", { records: historicalData });
      triggerDownload(blob, `${metrics.ticker || "stock"}_historical_data.csv`);
    } catch (err) {
      alert("Download failed: " + err.message);
    }
  };

  // Filtered records for table
  const filteredRecords = historicalData.filter(r => {
    if (!searchQuery) return true;
    return r.Date.includes(searchQuery) ||
           String(r.Close).includes(searchQuery) ||
           String(r.Volume).includes(searchQuery);
  });

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = filteredRecords.slice((currentPageNum - 1) * pageSize, currentPageNum * pageSize);

  return (
    <div className="page-body">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Database className="text-cyan" size={24} />
            Stock Data Explorer & Ingestion
          </h1>
          <p className="page-subtitle">
            Fetch real market history from Yahoo Finance, test with bundled sample datasets, or upload your own CSV records.
          </p>
        </div>

        {historicalData.length > 0 && (
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-secondary" onClick={handleDownloadHistorical}>
              <Download size={15} /> Download Cleaned CSV
            </button>
            <button className="btn btn-primary" onClick={() => setCurrentPage("preprocessing")}>
              Proceed to Preprocessing <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="alert-banner alert-danger">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div>{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="alert-banner alert-info">
          <CheckCircle size={18} style={{ flexShrink: 0 }} />
          <div>{successMsg}</div>
        </div>
      )}

      {/* Control Panel: Data Retrieval */}
      <div className="card">
        <h2 className="card-title" style={{ marginBottom: 14 }}>
          <Search size={18} className="text-cyan" />
          Select Asset & Configuration
        </h2>

        {/* Quick Tickers */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>Quick Select:</span>
          {quickTickers.map(t => (
            <button
              key={t.sym}
              type="button"
              className="btn btn-secondary"
              style={{ padding: "4px 10px", fontSize: 12 }}
              onClick={() => {
                setTickerInput(t.sym);
              }}
            >
              <strong>{t.sym}</strong> <span style={{ color: "#94a3b8", fontSize: 11 }}>({t.name})</span>
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, alignItems: "flex-end" }}>
          <div className="form-group">
            <label className="form-label">Ticker Symbol</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. AAPL, MSFT, RELIANCE.NS"
              value={tickerInput}
              onChange={e => setTickerInput(e.target.value.toUpperCase())}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Start Date (Optional)</label>
            <input
              type="date"
              className="input"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">End Date (Optional)</label>
            <input
              type="date"
              className="input"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Interval</label>
            <select className="select" value={interval} onChange={e => setInterval(e.target.value)}>
              <option value="1d">Daily (1d)</option>
              <option value="1wk">Weekly (1wk)</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          <button
            className="btn btn-primary"
            onClick={() => handleFetchData(false)}
            disabled={loading}
          >
            {loading ? "Fetching..." : "Fetch Market Data (Yahoo Finance)"}
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => handleFetchData(true)}
            disabled={loading}
          >
            <Sparkles size={15} style={{ color: "#f59e0b" }} /> Load Offline Sample Data
          </button>

          <label className="btn btn-secondary" style={{ cursor: "pointer" }}>
            <UploadCloud size={15} /> Upload CSV File
            <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: "none" }} />
          </label>
        </div>
      </div>

      {/* Dataset Summary & Charts */}
      {historicalData.length > 0 && (
        <>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">TOTAL OBSERVATIONS</div>
              <div className="metric-value">{metrics.total_records || historicalData.length}</div>
              <div className="metric-sub" style={{ color: "#94a3b8" }}>
                {metrics.start_date} to {metrics.end_date}
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">LATEST CLOSE</div>
              <div className="metric-value">
                {metrics.currency === "INR" ? "₹" : "$"}{metrics.latest_price ? metrics.latest_price.toFixed(2) : "—"}
              </div>
              <div className="metric-sub">
                <span className={metrics.pct_change >= 0 ? "text-bullish" : "text-bearish"}>
                  {metrics.pct_change >= 0 ? "+" : ""}{metrics.pct_change}%
                </span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">52-WEEK HIGH</div>
              <div className="metric-value">
                {metrics.currency === "INR" ? "₹" : "$"}{metrics.high_52w || "—"}
              </div>
              <div className="metric-sub" style={{ color: "#64748b" }}>Annual resistance</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">52-WEEK LOW</div>
              <div className="metric-value">
                {metrics.currency === "INR" ? "₹" : "$"}{metrics.low_52w || "—"}
              </div>
              <div className="metric-sub" style={{ color: "#64748b" }}>Annual support</div>
            </div>
          </div>

          {/* Interactive Chart */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 12 }}>
              Historical Price Action
            </h2>
            <PriceChart data={historicalData} currency={metrics.currency} />
            <VolumeChart data={historicalData} />
          </div>

          {/* Paginated Data Table */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <FileText size={18} className="text-cyan" />
                Raw Observations Table ({filteredRecords.length} records)
              </h2>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="text"
                  className="input"
                  style={{ width: 180, padding: "5px 10px", fontSize: 12 }}
                  placeholder="Search date or price..."
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setCurrentPageNum(1);
                  }}
                />
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Open</th>
                    <th>High</th>
                    <th>Low</th>
                    <th>Close</th>
                    <th>Adj Close</th>
                    <th>Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{r.Date}</td>
                      <td>{Number(r.Open).toFixed(2)}</td>
                      <td>{Number(r.High).toFixed(2)}</td>
                      <td>{Number(r.Low).toFixed(2)}</td>
                      <td style={{ fontWeight: 700, color: "#38bdf8" }}>{Number(r.Close).toFixed(2)}</td>
                      <td>{Number(r["Adj Close"] || r.Close).toFixed(2)}</td>
                      <td style={{ color: "#94a3b8" }}>{Number(r.Volume).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                Page {currentPageNum} of {totalPages}
              </span>

              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: "4px 10px", fontSize: 12 }}
                  disabled={currentPageNum === 1}
                  onClick={() => setCurrentPageNum(p => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: "4px 10px", fontSize: 12 }}
                  disabled={currentPageNum >= totalPages}
                  onClick={() => setCurrentPageNum(p => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
