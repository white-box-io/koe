import { invoke } from "@tauri-apps/api/core";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { KoeProvider } from "./state/KoeProvider";
import "./styles/tokens.css";
import "./styles/base.css";

const logUiError = (message: string) => invoke("log_ui_error", { message: `${new Date().toISOString()} ${message}` });
window.addEventListener("error", (event) => logUiError(`${event.message}\n${event.error?.stack ?? ""}`));
window.addEventListener("unhandledrejection", (event) => logUiError(`rejection: ${String(event.reason)}`));

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <KoeProvider>
      <App />
    </KoeProvider>
  </React.StrictMode>,
);
