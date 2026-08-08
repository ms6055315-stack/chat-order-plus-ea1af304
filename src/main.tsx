import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerOfflineSW } from "./lib/registerSW";
import { enableOfflineDataBackup, restoreOfflineData } from "./lib/durableStorage";

const root = document.getElementById("root");
if (!root) throw new Error("Application root was not found");

void restoreOfflineData().finally(() => {
  enableOfflineDataBackup();
  createRoot(root).render(<App />);
});

registerOfflineSW();
// Ask the browser to keep POS data safe from automatic eviction (offline use).
if (typeof navigator !== "undefined" && navigator.storage?.persist) {
  void navigator.storage.persist().catch(() => {});
}

