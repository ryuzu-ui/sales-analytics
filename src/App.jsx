import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

import Dashboard from "./pages/Dashboard";
import SalesRecords from "./pages/SalesRecords";
import DataStudio from "./pages/DataStudio";
import SalesAnalysis from "./pages/SalesAnalysis";
import PatternEDA from "./pages/PatternEDA";
import Correlation from "./pages/Correlation";
import Forecasting from "./pages/Forecasting";
import StatisticalAnalysis from "./pages/StatisticalAnalysis";
import Insights from "./pages/Insights";
import Reports from "./pages/Reports";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sales-records" element={<SalesRecords />} />
          <Route path="/data-studio" element={<DataStudio />} />
          <Route path="/sales-analysis" element={<SalesAnalysis />} />
          <Route path="/pattern-eda" element={<PatternEDA />} />
          <Route path="/correlation" element={<Correlation />} />
          <Route path="/forecasting" element={<Forecasting />} />
          <Route
            path="/statistical-analysis"
            element={<StatisticalAnalysis />}
          />
          <Route path="/insights" element={<Insights />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;