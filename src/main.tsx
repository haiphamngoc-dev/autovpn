import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./global.css";
import App from "@app/App";
import { initI18n } from "@shared/i18n";
import { loadAppearanceSettings } from "@shared/settings/appearance";
import { loadAppLockSettings } from "@shared/settings/appLock";
import { loadWindowBehaviorSettings } from "@shared/settings/windowBehavior";
import { StrictMode, createElement } from "react";
import ReactDOM from "react-dom/client";

async function bootstrap() {
  const [appearance, appLock, windowBehavior] = await Promise.all([
    loadAppearanceSettings(),
    loadAppLockSettings(),
    loadWindowBehaviorSettings(),
  ]);
  await initI18n(appearance.language);

  const root = document.getElementById("root");

  if (!root) {
    throw new Error("Root element #root not found");
  }

  ReactDOM.createRoot(root).render(
    createElement(
      StrictMode,
      null,
      createElement(App, { appearance, appLock, windowBehavior })
    )
  );
}

void bootstrap();
