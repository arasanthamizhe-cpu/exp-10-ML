const API_BASE = "http://127.0.0.1:8000/api";

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async getTickers() {
    const res = await fetch(`${API_BASE}/tickers`);
    return res.json();
  },

  async loadStockData({ ticker, startDate, endDate, interval, forceSample = false }) {
    const res = await fetch(`${API_BASE}/data/load`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticker,
        start_date: startDate || null,
        end_date: endDate || null,
        interval: interval || "1d",
        force_sample: forceSample
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to load stock data");
    return data;
  },

  async uploadCSV(file) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/data/upload`, {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to process CSV file");
    return data;
  },

  async preprocessData(params) {
    const res = await fetch(`${API_BASE}/data/preprocess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to preprocess data");
    return data;
  },

  async trainAndForecast(params) {
    const res = await fetch(`${API_BASE}/forecast/train`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Forecasting failed");
    return data;
  },

  async runBacktest(params) {
    const res = await fetch(`${API_BASE}/backtest/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Backtest failed");
    return data;
  },

  async exportReport(exportType, payload) {
    const res = await fetch(`${API_BASE}/reports/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ export_type: exportType, payload })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Export failed");
    }
    return res.blob();
  }
};

export function triggerDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
