import {
  LayoutDashboard,
  Table2,
  Database,
  BarChart3,
  Activity,
  GitCompare,
  TrendingUp,
  FlaskConical,
  Lightbulb,
  FileText,
  X,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const navItems = [
  {
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Sales Records",
    path: "/sales-records",
    icon: Table2,
  },
  {
    label: "Data Studio",
    path: "/data-studio",
    icon: Database,
  },
  {
    label: "Sales Analysis",
    path: "/sales-analysis",
    icon: BarChart3,
  },
  {
    label: "Pattern & EDA",
    path: "/pattern-eda",
    icon: Activity,
  },
  {
    label: "Correlation",
    path: "/correlation",
    icon: GitCompare,
  },
  {
    label: "Forecasting",
    path: "/forecasting",
    icon: TrendingUp,
  },
  {
    label: "Statistical Analysis",
    path: "/statistical-analysis",
    icon: FlaskConical,
  },
  {
    label: "Insights",
    path: "/insights",
    icon: Lightbulb,
  },
  {
    label: "Reports",
    path: "/reports",
    icon: FileText,
  },
];

function Sidebar({ mobileOpen, setMobileOpen }) {
  return (
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-header">
        <div className="brand-mark">SA</div>

        <div className="brand-text">
          <strong>Sales</strong>
          <span>Analytics</span>
        </div>

        <button
          className="mobile-close"
          onClick={() => setMobileOpen(false)}
        >
          <X size={22} />
        </button>
      </div>

      <div className="sidebar-label">
        ANALYTICS
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} strokeWidth={2.3} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="dataset-status">
          <div className="status-dot" />

          <div>
            <strong>Dataset Ready</strong>
            <span>Online Retail</span>
          </div>
        </div>

        <div className="sidebar-version">
          SALES ANALYTICS v1.0
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;