import React from "react";
import {
  Info,
  Target,
  Layers,
  Cpu,
  LineChart,
  ShieldAlert,
  Sparkles,
  BookOpen,
  Code
} from "lucide-react";

export default function About() {
  return (
    <div className="page-body">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Info className="text-cyan" size={24} />
            Academic Capstone Documentation: StockVision AI
          </h1>
          <p className="page-subtitle">
            Stock Market Forecasting & Quantitative Backtesting Platform — System Design & Engineering Specification.
          </p>
        </div>
      </div>

      {/* Problem Statement & Aim */}
      <div className="grid-2">
        <div className="card">
          <h2 className="card-title" style={{ color: "#38bdf8", marginBottom: 10 }}>
            <Target size={18} /> Problem Statement
          </h2>
          <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
            Retail investors and academic researchers often encounter significant hurdles when attempting to evaluate algorithmic trading strategies and machine learning forecasts. Common pitfalls include <strong>data leakage</strong> (such as fitting scalers on future test observations), <strong>look-ahead bias</strong> (executing trades at the exact closing timestamp a signal is generated rather than the subsequent period), and conflating statistical forecasting accuracy (e.g. low MAE) with actual risk-adjusted trading profitability.
          </p>
        </div>

        <div className="card">
          <h2 className="card-title" style={{ color: "#10b981", marginBottom: 10 }}>
            <Sparkles size={18} /> Project Aim & Core Objectives
          </h2>
          <ul style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, paddingLeft: 18 }}>
            <li><strong>Analyze historical market data:</strong> Ingest real-world OHLCV price series and audit missing observations.</li>
            <li><strong>Enforce leak-free preprocessing:</strong> Execute strictly chronological splits and fit scalers solely on training data.</li>
            <li><strong>Non-linear forecasting:</strong> Train feedforward neural networks (MLPRegressor) to project future multi-step trajectories.</li>
            <li><strong>Realistic backtesting:</strong> Simulate SMA crossover rules incorporating execution delays, commissions, and drawdown metrics.</li>
          </ul>
        </div>
      </div>

      {/* Proposed Solution & System Architecture */}
      <div className="card">
        <h2 className="card-title" style={{ color: "#f8fafc", marginBottom: 12 }}>
          <Layers size={18} className="text-cyan" />
          Proposed System Architecture & Dataflow
        </h2>

        <div style={{ background: "#0b1222", padding: 18, borderRadius: 8, border: "1px solid #1e293b", fontFamily: "JetBrains Mono", fontSize: 12, lineHeight: 1.8, color: "#38bdf8", overflowX: "auto" }}>
          [User Interface (React + Vite)]<br/>
          &nbsp;&nbsp;&nbsp;&darr; (HTTP REST / JSON API)<br/>
          [FastAPI Backend Engine]<br/>
          &nbsp;&nbsp;&nbsp;&bull; Data Service: yfinance Live Retrieval / Bundled Offline CSV Fallback / CSV Uploader<br/>
          &nbsp;&nbsp;&nbsp;&bull; Preprocessing Engine: Chronological Sorting &rarr; Audit &rarr; Missing Imputation &rarr; Normalization<br/>
          &nbsp;&nbsp;&nbsp;&bull; Machine Learning Core: Train-only Scaler &rarr; MLPRegressor / Baselines &rarr; Recursive Multi-Step Projections<br/>
          &nbsp;&nbsp;&nbsp;&bull; Quant Backtester: Signal Generation at t close &rarr; Execution at t+1 &rarr; Commission Deductions &rarr; Alpha / Sharpe / Drawdown<br/>
          &nbsp;&nbsp;&nbsp;&bull; Reporting Engine: CSV Exports &amp; Print-Ready Academic Technical Summaries
        </div>
      </div>

      {/* Machine Learning & Backtesting Methodology */}
      <div className="grid-2">
        <div className="card">
          <h2 className="card-title" style={{ color: "#38bdf8", marginBottom: 10 }}>
            <Cpu size={18} /> Machine Learning Methodology
          </h2>
          <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
            <p style={{ marginBottom: 8 }}>
              <strong>1. Sequence Formulation:</strong> The time series is mapped into sliding windows of length \(W\) (e.g. 30 lag days) to predict the closing price \(y_{t+1}\).
            </p>
            <p style={{ marginBottom: 8 }}>
              <strong>2. Feedforward Neural Network (MLP):</strong> Uses an MLPRegressor architecture with dual hidden layers (64, 32 neurons), ReLU activation, Adam optimizer, and early stopping.
            </p>
            <p>
              <strong>3. Multi-Step Projections:</strong> Future horizons (\(H = 1, 5, 10\) days) are estimated recursively by appending predicted values to the sliding feature window and projecting into subsequent business days (skipping weekends).
            </p>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title" style={{ color: "#f59e0b", marginBottom: 10 }}>
            <LineChart size={18} /> Quantitative Backtesting Methodology
          </h2>
          <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
            <p style={{ marginBottom: 8 }}>
              <strong>1. Moving Average Crossover:</strong> A long position is triggered when the short SMA exceeds the long SMA (SMA_short &gt; SMA_long) and exited when it dips below.
            </p>
            <p style={{ marginBottom: 8 }}>
              <strong>2. Anti-Lookahead Execution:</strong> Orders are entered with a 1-period execution lag (\(Position_t = Signal_{t-1}\)) to model real-world trade submission.
            </p>
            <p>
              <strong>3. Risk-Adjusted Evaluation:</strong> Calculates Maximum Drawdown, Annualized Return (CAGR), and Sharpe Ratio assuming an annual risk-free baseline and documented trading commissions.
            </p>
          </div>
        </div>
      </div>

      {/* Technology Stack Table */}
      <div className="card">
        <h2 className="card-title" style={{ color: "#f8fafc", marginBottom: 12 }}>
          <Code size={18} className="text-cyan" />
          Technical Stack Specifications
        </h2>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>Technology / Library</th>
                <th>Engineering Justification</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Frontend Framework</td>
                <td style={{ color: "#38bdf8" }}>React 19 + Vite 8</td>
                <td>Ultra-fast HMR, component-driven modularity, modern JavaScript execution.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Visualizations</td>
                <td style={{ color: "#38bdf8" }}>Recharts + SVG Charts</td>
                <td>Responsive interactive financial charts with custom tooltips, crosshairs, and time filters.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Backend REST API</td>
                <td style={{ color: "#10b981" }}>Python FastAPI + Uvicorn</td>
                <td>High-performance asynchronous REST endpoints with Pydantic type safety and validation.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Machine Learning</td>
                <td style={{ color: "#10b981" }}>Scikit-learn (MLPRegressor)</td>
                <td>Reliable, dependency-lightweight neural network implementation runnable in any local environment.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Data Processing</td>
                <td style={{ color: "#10b981" }}>Pandas & NumPy</td>
                <td>Vectorized time-series manipulations, rolling moving averages, and metrics calculation.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Market Ingestion</td>
                <td style={{ color: "#10b981" }}>yfinance & Bundled CSVs</td>
                <td>End-of-day market data ingestion with automatic offline sample dataset fallback.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Limitations & Future Enhancements */}
      <div className="grid-2">
        <div className="card">
          <h2 className="card-title" style={{ color: "#f43f5e", marginBottom: 10 }}>
            <ShieldAlert size={18} /> Practical System Limitations
          </h2>
          <ul style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, paddingLeft: 18 }}>
            <li>Feedforward MLP does not preserve persistent recurrent internal memory gates like an LSTM.</li>
            <li>Simulated backtesting models fixed commissions but does not model dynamic market depth slippage.</li>
            <li>Stock prices are subject to macroeconomic shocks, earnings announcements, and geopolitical sentiment not present in historical price lags alone.</li>
          </ul>
        </div>

        <div className="card">
          <h2 className="card-title" style={{ color: "#38bdf8", marginBottom: 10 }}>
            <Sparkles size={18} /> Future Enhancements
          </h2>
          <ul style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, paddingLeft: 18 }}>
            <li>Integration of PyTorch / TensorFlow LSTM and Transformer architectures where GPU hardware is available.</li>
            <li>Natural Language Processing (NLP) sentiment analysis on real-time financial news headlines and SEC filings.</li>
            <li>Multi-asset portfolio Markowitz Mean-Variance optimization and automated stop-loss / take-profit sizing.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
