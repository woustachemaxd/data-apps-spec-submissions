import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./index.css";
import App from "./App";
// `DataPage` (starter schema) removed per request
import ScorecardPage from "./pages/Scorecard";
import SalesPage from "./pages/Sales";
import WastePage from "./pages/Waste";
import LocationPage from "./pages/Location";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<App />} />
        {/* removed /data starter page */}
        <Route path="/scorecard" element={<ScorecardPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/waste" element={<WastePage />} />
        <Route path="/location/:id" element={<LocationPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
