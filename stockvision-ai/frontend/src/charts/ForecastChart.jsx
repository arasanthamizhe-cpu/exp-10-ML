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

export default function ForecastChart({ testPredictions = [], futureForecast = [], currency = "USD" }) {
  if ((!testPredictions || testPredictions.length === 0) && (!futureForecast || futureForecast.length === 0)) {
    return (
      <div style={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
        Train model and generate forecast to view chart.
      </div>
    );
  }

  // Combine test and future predictions for a unified chronological chart
  const combinedData = [];

  testPredictions.forEach(item => {
    combinedData.push({
      Date: item.date,
      Actual: item.actual,
      Predicted: item.predicted,
      Forecast: null
    });
  });

  // Connect last test prediction with first future forecast point
  if (testPredictions.length > 0 && futureForecast.length > 0) {
    const lastItem = testPredictions[testPredictions.length - 1];
    // We can show forecast starting from the last point
    combinedData[combinedData.length - 1].Forecast = lastItem.predicted;
  }

  futureForecast.forEach(item => {
    combinedData.push({
      Date: item.date,
      Actual: null,
      Predicted: null,
      Forecast: item.predicted_price
    });
  });

  const allVals = combinedData.flatMap(d => [d.Actual, d.Predicted, d.Forecast].filter(v => v !== null && v !== undefined));
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);
  const yDomain = [Math.floor(minVal * 0.96), Math.ceil(maxVal * 1.04)];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-chart-tooltip">
          <p style={{ color: "#94a3b8", fontWeight: 600 }}>{label}</p>
          {payload.map((entry, index) => {
            if (entry.value === null || entry.value === undefined) return null;
            return (
              <p key={index} style={{ color: entry.color, fontWeight: 600 }}>
                {entry.name}: {currency === "INR" ? "₹" : "$"}{Number(entry.value).toFixed(2)}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ height: 340, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={combinedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="Date" stroke="#64748b" tick={{ fontSize: 11 }} minTickGap={25} />
          <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={yDomain} tickFormatter={v => `${currency === "INR" ? "₹" : "$"}${v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
          <Line
            type="monotone"
            dataKey="Actual"
            name="Actual Test Price"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="Predicted"
            name="Model Prediction (Out-of-sample)"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="Forecast"
            name="Projected Future Forecast"
            stroke="#f59e0b"
            strokeWidth={2.5}
            strokeDasharray="4 4"
            dot={{ r: 4, fill: "#f59e0b" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
