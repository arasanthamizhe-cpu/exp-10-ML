import React from "react";
import {
  LayoutDashboard,
  Database,
  Sliders,
  TrendingUp,
  LineChart,
  Award,
  FileText,
  Info,
  Activity
} from "lucide-react";

export default function Sidebar({ currentPage, setCurrentPage, ticker, isSample }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "explorer", label: "Stock Data Explorer", icon: Database },
    { id: "preprocessing", label: "Data Preprocessing", icon: Sliders },
    { id: "forecasting", label: "ML Forecasting", icon: TrendingUp },
    { id: "backtesting", label: "Strategy Backtesting", icon: LineChart },
    { id: "evaluation", label: "Model Evaluation", icon: Award },
    { id: "reports", label: "Reports & Downloads", icon: FileText },
    { id: "about", label: "About the Project", icon: Info }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-badge">
          <Activity size={22} />
        </div>
        <div>
          <div className="brand-title">StockVision AI</div>
          <div className="brand-subtitle">Quant & ML Platform</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => setCurrentPage(item.id)}
            >
              <Icon className="nav-item-icon" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontSize: 11, color: "#64748b", display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span>ACTIVE ASSET</span>
          <span style={{ color: "#38bdf8", fontWeight: 700 }}>{ticker || "AAPL"}</span>
        </div>
        <div style={{ fontSize: 10, color: "#475569" }}>
          {isSample ? "Mode: Sample Simulation" : "Mode: Online / Custom"}
        </div>
      </div>
    </aside>
  );
}
