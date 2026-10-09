import React from "react";
import { AlertTriangle, CheckCircle, Wifi, RefreshCw } from "lucide-react";

export default function Topbar({
  metrics = {},
  dataSource = "None",
  backendHealthy = true,
  onRefresh,
  loading = false
}) {
  const isSample = dataSource && dataSource.toUpperCase().includes("SAMPLE");

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-ticker-badge">
          <span style={{ fontWeight: 700, color: "#38bdf8" }}>
            {metrics.ticker || "AAPL"}
          </span>
          <span style={{ color: "#64748b" }}>|</span>
          <span style={{ color: "#94a3b8", fontSize: 12 }}>
            {metrics.company_name || "Apple Inc."}
          </span>
        </div>

        {metrics.latest_price && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "JetBrains Mono" }}>
              {metrics.currency === "INR" ? "₹" : "$"}{metrics.latest_price.toFixed(2)}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: metrics.pct_change >= 0 ? "#10b981" : "#f43f5e"
              }}
            >
              {metrics.pct_change >= 0 ? "+" : ""}{metrics.pct_change}% ({metrics.price_change >= 0 ? "+" : ""}{metrics.price_change})
            </span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {isSample ? (
          <div className="status-indicator status-sample">
            <AlertTriangle size={14} />
            <span>SAMPLE DATA — NOT REAL MARKET DATA</span>
          </div>
        ) : (
          <div className="status-indicator status-online">
            <CheckCircle size={14} />
            <span style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {dataSource || "Market Data Connected"}
            </span>
          </div>
        )}

        <button
          className="btn btn-secondary"
          onClick={onRefresh}
          disabled={loading}
          style={{ padding: "6px 10px", fontSize: 12 }}
          title="Reload data"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: backendHealthy ? "#10b981" : "#f43f5e" }}>
          <Wifi size={13} />
          <span>{backendHealthy ? "API Online" : "API Offline"}</span>
        </div>
      </div>
    </header>
  );
}
