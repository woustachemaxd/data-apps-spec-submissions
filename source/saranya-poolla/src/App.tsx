import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import LocationDetail from "./pages/LocationDetail";
import AdvancedLocations from "./pages/AdvancedLocations";
import PredictiveAnalytics from "./components/PredictiveAnalytics";
import RealTimeDashboard from "./components/RealTimeDashboard";
import SmartInventory from "./components/SmartInventory";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/location/:id" element={<LocationDetail />} />
        <Route path="/advanced-locations" element={<AdvancedLocations />} />
        <Route path="/predictive-analytics" element={<PredictiveAnalytics />} />
        <Route path="/real-time" element={<RealTimeDashboard />} />
        <Route path="/inventory" element={<SmartInventory />} />
      </Routes>
    </BrowserRouter>
  );
}
