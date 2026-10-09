import React from "react";
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

export default function EquityCurveChart({ equityCurve = [] }) {
  if (!equityCurve || equityCurve.length === 0) {
    return (
      <div style={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
        Execute backtest simulation to view equity curve.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-chart-tooltip">
          <p style={{ color: "#94a3b8", fontWeight: 600 }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, fontWeight: 600 }}>
              {entry.name}: ${Number(entry.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ height: 320, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={equityCurve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} minTickGap={30} />
          <YAxis
            stroke="#64748b"
            tick={{ fontSize: 11 }}
            tickFormatter={v => `$${(v / 1000).toFixed(1)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
          <Line
            type="monotone"
            dataKey="strategy_equity"
            name="Strategy Portfolio"
            stroke="#10b981"
            strokeWidth={2.2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="benchmark_equity"
            name="Buy & Hold Benchmark"
            stroke="#64748b"
            strokeWidth={1.8}
            strokeDasharray="4 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
