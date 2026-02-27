import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { DateRangeProvider } from "@/hooks/useDateRange";
import DashboardLayout from "@/components/DashboardLayout";
import OverviewPage from "@/pages/Overview";
import ByLocationPage from "@/pages/ByLocation";
import ByLocationListPage from "@/pages/ByLocationList";
import DataPage from "@/pages/Data";

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <DateRangeProvider>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="by-location" element={<ByLocationListPage />} />
            <Route path="by-location/:locationId" element={<ByLocationPage />} />
          </Route>
          <Route path="/data" element={<DataPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DateRangeProvider>
    </BrowserRouter>
  );
}
