import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

export default function DrawdownChart({ equityCurve = [] }) {
  if (!equityCurve || equityCurve.length === 0) return null;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-chart-tooltip">
          <p style={{ color: "#94a3b8" }}>{label}</p>
          <p style={{ color: "#f43f5e", fontWeight: 600 }}>
            Drawdown: {Number(payload[0].value).toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ height: 160, width: "100%", marginTop: 12 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={equityCurve} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} minTickGap={30} />
          <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="drawdown_pct"
            name="Drawdown %"
            stroke="#f43f5e"
            fillOpacity={1}
            fill="url(#drawdownGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
