import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./index.css";
import App from "./App";
import DataPage from "./pages/Data";
import LocationScorecardPage from "./pages/LocationScorecard";
import HistoricalSalesPage from "./pages/HistoricalSales";
import InventoryWastePage from "./pages/InventoryWaste";
import LocationDetailPage from "./pages/LocationDetail";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/scorecard" element={<LocationScorecardPage />} />
          <Route path="/sales" element={<HistoricalSalesPage />} />
          <Route path="/waste" element={<InventoryWastePage />} />
          <Route path="/location/:locationId" element={<LocationDetailPage />} />
          <Route path="/data" element={<DataPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
