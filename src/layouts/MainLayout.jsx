import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const location = useLocation();

  const pageTitles = {
    "/": "Dashboard",
    "/sales-records": "Sales Records",
    "/data-studio": "Data Studio",
    "/sales-analysis": "Sales Analysis",
    "/pattern-eda": "Pattern & EDA",
    "/correlation": "Correlation Analysis",
    "/forecasting": "Forecasting",
    "/statistical-analysis": "Statistical Analysis",
    "/insights": "Insights",
    "/reports": "Reports",
  };

  const title = pageTitles[location.pathname] || "Sales Analytics";

  return (
    <div className="app-shell">
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {mobileOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <main className="main-content">
        <Topbar
          title={title}
          onMenuClick={() => setMobileOpen(true)}
        />

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default MainLayout;