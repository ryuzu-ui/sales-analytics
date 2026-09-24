import {
  Menu,
  Bell,
  Upload,
  Moon,
  Sun,
} from "lucide-react";

function Topbar({
  title,
  onMenuClick,
  darkMode,
  setDarkMode,
}) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="mobile-menu"
          onClick={onMenuClick}
        >
          <Menu size={23} />
        </button>

        <div>
          <div className="breadcrumb">
            SALES ANALYTICS / SYSTEM
          </div>

          <h1>{title}</h1>
        </div>
      </div>

      <div className="topbar-actions">
        <button className="topbar-button">
          <Upload size={17} />
          Import Data
        </button>

        <button className="icon-button">
          <Bell size={18} />
        </button>

        <div className="profile">
          <div className="profile-avatar">
            DA
          </div>

          <div className="profile-info">
            <strong>Data Analyst</strong>
            <span>Administrator</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;