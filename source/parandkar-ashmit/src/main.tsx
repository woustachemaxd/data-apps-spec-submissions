import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import App from "./App";
import DataPage from "./pages/Data";
import AiPage from "./pages/Ai";
import SalesPage from "./pages/Sales";
import WastePage from "./pages/Waste";
import ReviewsPage from "./pages/Reviews";
import ScorecardPage from "./pages/Scorecard";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        {/* <Route path="/" element={<App />} /> */}
        <Route path="/" element={<Navigate to="/sales" replace />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/waste" element={<WastePage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/scorecard" element={<ScorecardPage />} />
        <Route path="/data" element={<DataPage />} />
        <Route path="/ai" element={<AiPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);