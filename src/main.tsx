import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerOfflineSW } from "./lib/registerSW";
import { initPosSync, setRemotePrintHandler } from "./lib/posSync";
import { printHtml } from "./lib/printing";

createRoot(document.getElementById("root")!).render(<App />);

registerOfflineSW();
setRemotePrintHandler((html) => printHtml(html));
void initPosSync();

// Ask the browser to keep POS data safe from automatic eviction (offline use).
if (typeof navigator !== "undefined" && navigator.storage?.persist) {
  void navigator.storage.persist().catch(() => {});
}

