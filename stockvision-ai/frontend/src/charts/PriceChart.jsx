import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";

export default function PriceChart({ data, currency = "USD", shortMa = null, longMa = null }) {
  const [timeframe, setTimeframe] = useState("ALL");

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (timeframe === "ALL") return data;

    const count = data.length;
    let sliceCount = count;
    if (timeframe === "1M") sliceCount = Math.min(22, count);
    else if (timeframe === "3M") sliceCount = Math.min(66, count);
    else if (timeframe === "6M") sliceCount = Math.min(132, count);
    else if (timeframe === "1Y") sliceCount = Math.min(252, count);

    return data.slice(count - sliceCount);
  }, [data, timeframe]);

  if (!data || data.length === 0) {
    return (
      <div style={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
        No price data available. Load a stock to render chart.
      </div>
    );
  }

  const minPrice = Math.min(...filteredData.map(d => d.Close || d.price || 0));
  const maxPrice = Math.max(...filteredData.map(d => d.Close || d.price || 0));
  const yDomain = [Math.floor(minPrice * 0.95), Math.ceil(maxPrice * 1.05)];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-chart-tooltip">
          <p style={{ color: "#94a3b8", fontWeight: 600 }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, fontWeight: 600 }}>
              {entry.name}: {currency === "INR" ? "₹" : "$"}{Number(entry.value).toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "#94a3b8" }}>
          Showing {filteredData.length} sessions
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          {["1M", "3M", "6M", "1Y", "ALL"].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                background: timeframe === tf ? "rgba(56, 189, 248, 0.2)" : "#131c31",
                color: timeframe === tf ? "#38bdf8" : "#94a3b8",
                border: timeframe === tf ? "1px solid #38bdf8" : "1px solid #1e293b",
                borderRadius: 6,
                padding: "3px 10px",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 320, width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="Date" stroke="#64748b" tick={{ fontSize: 11 }} minTickGap={30} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={yDomain} tickFormatter={v => `${currency === "INR" ? "₹" : "$"}${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
            <Line
              type="monotone"
              dataKey="Close"
              name="Close Price"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: "#38bdf8" }}
            />
            {shortMa && (
              <Line
                type="monotone"
                dataKey="short_ma"
                name={`SMA (${shortMa})`}
                stroke="#10b981"
                strokeWidth={1.5}
                dot={false}
              />
            )}
            {longMa && (
              <Line
                type="monotone"
                dataKey="long_ma"
                name={`SMA (${longMa})`}
                stroke="#f59e0b"
                strokeWidth={1.5}
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
