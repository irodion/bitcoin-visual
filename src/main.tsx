import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { useThemeStore } from "./shared/stores/useThemeStore";
import "./index.css";

function syncThemeClass(theme: "dark" | "light") {
  document.documentElement.classList.toggle("light", theme === "light");
}
syncThemeClass(useThemeStore.getState().theme);
useThemeStore.subscribe((state, prev) => {
  if (state.theme !== prev.theme) syncThemeClass(state.theme);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
