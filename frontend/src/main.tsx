import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "cesium/Build/Cesium/Widgets/widgets.css";

import App from "./App";
import "./styles.css";
import "./feature-upgrades.css";
import "./workbench.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
