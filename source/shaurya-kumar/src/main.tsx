import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./index.css";
import App from "./App";
import { ThemeProvider } from "./components/ThemeProvider";
import { FilterProvider } from "./contexts/FilterContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <FilterProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path="/*" element={<App />} />
          </Routes>
        </BrowserRouter>
      </FilterProvider>
    </ThemeProvider>
  </StrictMode>
);
