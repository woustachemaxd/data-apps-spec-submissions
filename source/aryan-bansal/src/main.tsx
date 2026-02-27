import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useOutletContext } from "react-router-dom";

import "./index.css";
import App from "./App";
import { ThemeProvider } from "./components/layout/ThemeProvider";
import DashboardPage from "./pages/DashboardPage";
import SalesPage from "./pages/SalesPage";
import WastePage from "./pages/WastePage";
import type { DateRange } from "@/types/schema";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<App />}>
            <Route index element={<DashboardPageWrapper />} />
            <Route path="/sales" element={<SalesPageWrapper />} />
            <Route path="/waste" element={<WastePageWrapper />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);

function DashboardPageWrapper() {
  const { dateRange } = useOutletContext<{ dateRange: DateRange }>();
  return <DashboardPage dateRange={dateRange} />;
}

function SalesPageWrapper() {
  const { dateRange } = useOutletContext<{ dateRange: DateRange }>();
  return <SalesPage dateRange={dateRange} />;
}

function WastePageWrapper() {
  const { dateRange } = useOutletContext<{ dateRange: DateRange }>();
  return <WastePage dateRange={dateRange} />;
}
