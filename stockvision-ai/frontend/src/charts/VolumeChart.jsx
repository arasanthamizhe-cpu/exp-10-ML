import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function VolumeChart({ data }) {
  if (!data || data.length === 0) return null;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-chart-tooltip">
          <p style={{ color: "#94a3b8" }}>{label}</p>
          <p style={{ color: "#38bdf8", fontWeight: 600 }}>
            Volume: {Number(payload[0].value).toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ height: 160, width: "100%", marginTop: 12 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="Date" stroke="#64748b" tick={{ fontSize: 10 }} minTickGap={30} />
          <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1e6).toFixed(1)}M`} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="Volume" name="Volume" fill="#0284c7" opacity={0.65} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
