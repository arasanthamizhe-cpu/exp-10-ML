import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import DataExplorer from "./pages/DataExplorer";
import Preprocessing from "./pages/Preprocessing";
import Forecasting from "./pages/Forecasting";
import Backtesting from "./pages/Backtesting";
import ModelEvaluation from "./pages/ModelEvaluation";
import Reports from "./pages/Reports";
import About from "./pages/About";
import { api } from "./services/api";

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [historicalData, setHistoricalData] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [dataSource, setDataSource] = useState("");
  const [preprocessedData, setPreprocessedData] = useState([]);
  const [preprocessingResult, setPreprocessingResult] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [backtestData, setBacktestData] = useState(null);
  const [backendHealthy, setBackendHealthy] = useState(true);
  const [loading, setLoading] = useState(false);

  // Initial load: check health and populate default asset
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const health = await api.getHealth();
        setBackendHealthy(health.status === "healthy");
        
        // Load default initial asset (AAPL)
        const res = await api.loadStockData({ ticker: "AAPL", forceSample: true });
        setHistoricalData(res.data);
        setMetrics(res.metrics);
        setDataSource(res.source);

        // Pre-run lightweight baseline backtest and preprocess so dashboard shows rich values immediately
        const prep = await api.preprocessData({
          records: res.data,
          missing_policy: "forward_fill",
          lookback_window: 30,
          forecast_horizon: 5
        });
        setPreprocessingResult(prep);
        setPreprocessedData(prep.cleaned_data);

        const bt = await api.runBacktest({
          records: res.data,
          short_window: 10,
          long_window: 30,
          initial_capital: 10000
        });
        setBacktestData(bt);
      } catch (err) {
        console.warn("Backend not yet reachable on init:", err);
        setBackendHealthy(false);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const health = await api.getHealth();
      setBackendHealthy(health.status === "healthy");
      if (metrics.ticker) {
        const res = await api.loadStockData({ ticker: metrics.ticker, forceSample: false });
        setHistoricalData(res.data);
        setMetrics(res.metrics);
        setDataSource(res.source);
      }
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setLoading(false);
    }
  };

  const isSample = dataSource && dataSource.toUpperCase().includes("SAMPLE");

  return (
    <div className="app-container">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        ticker={metrics.ticker}
        isSample={isSample}
      />

      <div className="main-wrapper">
        <Topbar
          metrics={metrics}
          dataSource={dataSource}
          backendHealthy={backendHealthy}
          onRefresh={handleRefresh}
          loading={loading}
        />

        <main style={{ flex: 1 }}>
          {currentPage === "dashboard" && (
            <Dashboard
              metrics={metrics}
              historicalData={historicalData}
              forecastData={forecastData}
              backtestData={backtestData}
              setCurrentPage={setCurrentPage}
              dataSource={dataSource}
            />
          )}

          {currentPage === "explorer" && (
            <DataExplorer
              historicalData={historicalData}
              setHistoricalData={setHistoricalData}
              metrics={metrics}
              setMetrics={setMetrics}
              dataSource={dataSource}
              setDataSource={setDataSource}
              setCurrentPage={setCurrentPage}
            />
          )}

          {currentPage === "preprocessing" && (
            <Preprocessing
              historicalData={historicalData}
              preprocessedData={preprocessedData}
              setPreprocessedData={setPreprocessedData}
              preprocessingResult={preprocessingResult}
              setPreprocessingResult={setPreprocessingResult}
              setCurrentPage={setCurrentPage}
            />
          )}

          {currentPage === "forecasting" && (
            <Forecasting
              historicalData={historicalData}
              preprocessedData={preprocessedData}
              forecastData={forecastData}
              setForecastData={setForecastData}
              metrics={metrics}
              setCurrentPage={setCurrentPage}
            />
          )}

          {currentPage === "backtesting" && (
            <Backtesting
              historicalData={historicalData}
              backtestData={backtestData}
              setBacktestData={setBacktestData}
              metrics={metrics}
              setCurrentPage={setCurrentPage}
            />
          )}

          {currentPage === "evaluation" && (
            <ModelEvaluation
              forecastData={forecastData}
              metrics={metrics}
              setCurrentPage={setCurrentPage}
            />
          )}

          {currentPage === "reports" && (
            <Reports
              historicalData={historicalData}
              metrics={metrics}
              forecastData={forecastData}
              backtestData={backtestData}
              preprocessingResult={preprocessingResult}
              dataSource={dataSource}
            />
          )}

          {currentPage === "about" && (
            <About />
          )}
        </main>
      </div>
    </div>
  );
}
