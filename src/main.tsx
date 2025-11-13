import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@xyflow/react/dist/style.css";
import "./index.css";
import { ThemeProvider } from "./components/layout/theme-provider";

if (typeof window !== "undefined") {
  window.__RAWBIT_VERSION__ = __APP_VERSION__;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="app-theme">
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
