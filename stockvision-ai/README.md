# StockVision AI — Stock Market Forecasting & Backtesting Platform

**StockVision AI** is a full-stack financial analytics, machine learning forecasting, and quantitative backtesting web application designed for students, researchers, and algorithmic trading practitioners.

---

## 1. System Architecture & Workflow

```text
User Interface (React + Vite)
      │
      ▼ (REST API / JSON)
FastAPI Backend (Port 8000)
      ├── 1. Data Service (yfinance / Bundled Offline CSVs / Custom CSV Upload)
      ├── 2. Preprocessing Pipeline (8-Stage Chronological Audit & Scaling)
      ├── 3. Machine Learning Core (MLPRegressor / Baseline Regressors / Recursive Projections)
      ├── 4. Systematic Backtesting Engine (SMA Crossover with t+1 Execution Delay & Fees)
      ├── 5. Evaluation & Diagnostics (MAE, RMSE, MAPE, R², Residuals, Persistence Baselines)
      └── 6. Reporting Engine (CSV Exports & Printable HTML Technical Reports)
```

---

## 2. Key Objectives & Features

- **Historical Price Analysis:** Interactive OHLCV price and volume charts with multi-timeframe filters (`1M`, `3M`, `6M`, `1Y`, `ALL`).
- **Two Ingestion Modes:** 
  - **Mode A (Live Yahoo Finance):** Retrieve historical market bars for tickers such as `AAPL`, `MSFT`, `GOOGL`, `NVDA`, `RELIANCE.NS`, `TCS.NS`.
  - **Mode B (Reproducible Sample Data):** Bundled offline datasets clearly tagged with `SAMPLE DATA — NOT REAL MARKET DATA` for guaranteed demonstration without internet connectivity.
  - **CSV Upload:** Custom historical CSV dataset validation and parser.
- **8-Stage Preprocessing Pipeline:**
  1. Raw data ingestion & shape audit
  2. Schema verification (`Date`, `Open`, `High`, `Low`, `Close`, `Volume`)
  3. Type casting (ISO timestamps & `float64`)
  4. Chronological sorting (Strictly ascending, no random shuffling)
  5. Missing & duplicate audit
  6. Missing data policy execution (`forward_fill`, `backward_fill`, or `drop`)
  7. Feature normalization (`MinMaxScaler` or `StandardScaler` fitted **only on training data**)
  8. Sliding time-series window formulation ($W$ lookback observations, $H$ forecast horizon)
- **Machine Learning Forecasting:**
  - **Primary Model:** Multi-Layer Perceptron (`MLPRegressor` with dual hidden layers, ReLU activation, Adam optimizer, early stopping).
  - **Alternative Models:** Linear Regression (OLS), Ridge Regression (L2), Random Forest (100 Trees), and Simple Moving Average Baseline.
  - **Transparent Architecture Labeling:** Explicitly identified as a feedforward MLP network with sliding lag inputs rather than falsely claiming to be an LSTM.
  - **Recursive Multi-Step Projections:** Forecasts future $1$, $5$, or $10$ trading days forward, automatically skipping weekends.
- **Systematic Strategy Backtesting Simulator:**
  - Simple Moving Average Crossover ($SMA_{short}$ vs $SMA_{long}$).
  - **Strict Look-Ahead Bias Prevention:** Signals generated at Day $t$ close are executed with an intentional 1-period delay at Day $t+1$.
  - Realistic transaction fee deductions (commission percentage deducted per transaction).
  - Equity curve tracking, drawdown area curves, and trade log table.
  - Benchmark comparison against Buy-and-Hold with Alpha and Annualized Sharpe Ratio calculation.
- **Model Evaluation & Residual Diagnostics:**
  - MAE, RMSE, MAPE, and $R^2$ statistics.
  - Comparison against Naïve Persistence baseline ($y_{t-1}$) and SMA.
  - Residual error distribution chart ($e_t = y_t - \hat{y}_t$).
- **Reports & Downloads:**
  - Download Historical Data (CSV)
  - Download Predictions & Future Projections (CSV)
  - Download Backtesting Trades Log (CSV)
  - Download Consolidated Performance Metrics (CSV)
  - Generate Printable HTML / PDF Technical Summary Report.

---

## 3. Technology Stack

### Frontend
- **Framework:** React 19 + Vite 8 (JavaScript)
- **Styling:** Modern Bloomberg-style dark financial terminal theme with CSS variables and responsive grids
- **Charting:** Recharts (`LineChart`, `AreaChart`, `BarChart`, custom dark tooltips)
- **Icons:** Lucide React

### Backend
- **Framework:** Python 3.12 + FastAPI + Uvicorn
- **Data Manipulation:** Pandas & NumPy
- **Machine Learning:** Scikit-learn (`MLPRegressor`, `RandomForestRegressor`, `LinearRegression`, `Ridge`, `MinMaxScaler`)
- **Market Data Retrieval:** yfinance
- **Validation:** Pydantic

---

## 4. Project Directory Structure

```text
stockvision-ai/
├── backend/
│   ├── app.py                      # FastAPI REST application & endpoints
│   ├── requirements.txt            # Backend Python dependencies
│   ├── data_service.py             # Data fetching, sample fallback, CSV parsing
│   ├── preprocessing.py            # 8-stage time-series preprocessing pipeline
│   ├── forecasting.py              # ML models, multi-step projections, metrics
│   ├── backtesting.py              # Historical trading simulator & metrics
│   ├── evaluation.py               # Residual analysis & baseline benchmarks
│   ├── reports.py                  # CSV & printable HTML report generator
│   ├── generate_samples.py         # Offline sample data generator
│   ├── test_pipeline.py            # Backend pipeline integration test
│   ├── test_http_endpoints.py      # HTTP REST endpoints automated verification
│   └── sample_data/
│       ├── AAPL_sample.csv         # Bundled offline AAPL dataset
│       └── RELIANCE_sample.csv     # Bundled offline RELIANCE dataset
├── frontend/
│   ├── index.html                  # HTML template with Google Fonts
│   ├── package.json                # Frontend npm configuration
│   ├── vite.config.js              # Vite bundler configuration
│   └── src/
│       ├── App.jsx                 # Main application state & routing
│       ├── main.jsx                # React root mount
│       ├── index.css               # Dark financial terminal stylesheet
│       ├── components/
│       │   ├── Sidebar.jsx         # Navigation sidebar
│       │   └── Topbar.jsx          # Asset header & health indicators
│       ├── pages/
│       │   ├── Dashboard.jsx       # Page 1: Overview & KPI metrics
│       │   ├── DataExplorer.jsx    # Page 2: Stock search & CSV uploader
│       │   ├── Preprocessing.jsx   # Page 3: 8-stage preprocessing pipeline
│       │   ├── Forecasting.jsx     # Page 4: ML model training & projections
│       │   ├── Backtesting.jsx     # Page 5: Trading simulator & equity curve
│       │   ├── ModelEvaluation.jsx # Page 6: Diagnostics & baselines
│       │   ├── Reports.jsx         # Page 7: Exports & printable report
│       │   └── About.jsx           # Page 8: Academic capstone documentation
│       ├── charts/
│       │   ├── PriceChart.jsx      # Interactive price & SMA line chart
│       │   ├── VolumeChart.jsx     # Historical volume bar chart
│       │   ├── ForecastChart.jsx   # Actual vs predicted & future horizon
│       │   ├── EquityCurveChart.jsx# Strategy equity vs benchmark
│       │   ├── DrawdownChart.jsx   # Portfolio underwater drawdown area chart
│       │   └── ResidualChart.jsx   # Model residual error bar chart
│       └── services/
│           └── api.js              # Fetch client communicating with backend
├── start_backend.bat               # Windows batch launcher for backend
├── start_frontend.bat              # Windows batch launcher for frontend
└── README.md                       # Comprehensive project documentation
```

---

## 5. Installation & Setup Instructions

### Prerequisites
- Python 3.10+ (Python 3.12 recommended)
- Node.js 18+ and npm

### Step 1: Install Backend Dependencies
Open a terminal in `stockvision-ai/backend`:
```powershell
cd backend
pip install -r requirements.txt
```

### Step 2: Install Frontend Dependencies
Open a terminal in `stockvision-ai/frontend`:
```powershell
cd frontend
npm install
```

---

## 6. How to Launch the Application

### Option A: Using Helper Scripts (Windows)
Double-click:
1. `stockvision-ai/start_backend.bat` (Starts FastAPI backend on `http://127.0.0.1:8000`)
2. `stockvision-ai/start_frontend.bat` (Starts React Vite app on `http://127.0.0.1:5173`)

### Option B: From Command Line

**Terminal 1 — Backend:**
```powershell
cd "c:\Users\THAMIZHE\OneDrive\Desktop\exp 10\stockvision-ai\backend"
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 — Frontend:**
```powershell
cd "c:\Users\THAMIZHE\OneDrive\Desktop\exp 10\stockvision-ai\frontend"
npm run dev -- --host 127.0.0.1 --port 5173
```

Now open your web browser and navigate to:
**`http://127.0.0.1:5173/`**

---

## 7. Automated Testing & Verification

The project includes automated verification scripts:

1. **Pipeline Core Test:**
   ```powershell
   cd backend
   python test_pipeline.py
   ```
   *Verifies ingestion, preprocessing, MLP model training, future forecasting, crossover backtesting, and export generation.*

2. **Live HTTP REST API Test:**
   ```powershell
   cd backend
   python test_http_endpoints.py
   ```
   *Sends actual HTTP requests to `/api/health`, `/api/tickers`, `/api/data/load`, `/api/data/preprocess`, `/api/forecast/train`, `/api/backtest/run`, and `/api/reports/export`.*

3. **Frontend Production Build Test:**
   ```powershell
   cd frontend
   npm run build
   ```
   *Compiles all JSX, CSS, and assets with Vite with 0 syntax or bundling errors.*

---

## 8. Academic Integrity & Methodological Rigor

1. **No Look-Ahead Bias:**
   In the backtesting module, when a moving average crossover occurs at the closing price of observation $t$, the trade is entered at observation $t+1$. This models realistic trade routing.
2. **Strict Data Leakage Elimination:**
   MinMax normalizers and StandardScaler scalers are fitted exclusively on the training partition ($80\%$) and applied forward to the test set ($20\%$).
3. **No Shuffling:**
   Time-series observations are processed strictly in chronological order without random shuffling.
4. **Naïve Baseline Comparison:**
   The forecasting module rigorously compares the trained MLP against a Naïve persistence baseline ($y_{t-1}$) to prove whether the neural network learned real predictive signal.
5. **Academic & Demonstration Disclaimer:**
   All forecasted outputs and simulated returns are intended for educational and academic capstone demonstration purposes.
