import {
  Menu,
  Bell,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { useRef } from "react";
import { useSalesData } from "../context/SalesDataContext";

function Topbar({ title, onMenuClick }) {
  const fileInputRef = useRef(null);

  const {
    importFile,
    datasetName,
    isImported,
    isImporting,
    importError,
  } = useSalesData();

  const handleImportClick = () => {
    if (isImporting) return;

    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    await importFile(file);

    event.target.value = "";
  };

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
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xls,.xlsx"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        <button
          className="topbar-button"
          onClick={handleImportClick}
          disabled={isImporting}
        >
          {isImporting ? (
            <Loader2
              size={17}
              className="import-spinner"
            />
          ) : (
            <Upload size={17} />
          )}

          {isImporting
            ? "Importing..."
            : "Import Data"}
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

      {(datasetName || importError) && (
        <div className="dataset-import-status">
          {importError ? (
            <>
              <AlertCircle size={15} />
              <span>{importError}</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={15} />
              <span>
                {datasetName} imported
              </span>
            </>
          )}
        </div>
      )}
    </header>
  );
}

export default Topbar;