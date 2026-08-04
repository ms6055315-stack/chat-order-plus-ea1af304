import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerOfflineSW } from "./lib/registerSW";
import { initPosSync } from "./lib/posSync";

createRoot(document.getElementById("root")!).render(<App />);

registerOfflineSW();
void initPosSync();
