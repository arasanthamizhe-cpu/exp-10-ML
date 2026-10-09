import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from "recharts";

export default function ResidualChart({ residuals = [] }) {
  if (!residuals || residuals.length === 0) {
    return (
      <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
        No residual errors available.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const val = Number(payload[0].value);
      return (
        <div className="custom-chart-tooltip">
          <p style={{ color: "#94a3b8" }}>{label}</p>
          <p style={{ color: val >= 0 ? "#10b981" : "#f43f5e", fontWeight: 600 }}>
            Residual (Actual - Pred): {val.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ height: 260, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={residuals} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} minTickGap={30} />
          <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
          <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="residual"
            name="Residual Error"
            fill="#38bdf8"
            opacity={0.8}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
