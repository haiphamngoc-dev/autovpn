import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./global.css";
import App from "@app/App";
import { initI18n } from "@shared/i18n";
import { loadAppearanceSettings } from "@shared/settings/appearance";
import {
  getInvokeErrorMessage,
  hasAppLockPin,
  loadAppLockSettings,
} from "@shared/settings/appLock";
import { loadWindowBehaviorSettings } from "@shared/settings/windowBehavior";
import { StrictMode, createElement } from "react";
import ReactDOM from "react-dom/client";

async function bootstrap() {
  const [appearance, windowBehavior, hasPin] = await Promise.all([
    loadAppearanceSettings(),
    loadWindowBehaviorSettings(),
    hasAppLockPin(),
  ]);

  let appLock;
  let settingsTampered = false;

  try {
    appLock = await loadAppLockSettings(hasPin);
  } catch (error) {
    if (getInvokeErrorMessage(error) === "settings_tampered") {
      settingsTampered = true;
      appLock = {
        enabled: hasPin,
        lockWhenIdle: true,
        idleTimeout: "5" as const,
      };
    } else {
      throw error;
    }
  }

  await initI18n(appearance.language);

  const root = document.getElementById("root");

  if (!root) {
    throw new Error("Root element #root not found");
  }

  ReactDOM.createRoot(root).render(
    createElement(
      StrictMode,
      null,
      createElement(App, {
        appearance,
        appLock,
        windowBehavior,
        hasPin,
        settingsTampered,
      })
    )
  );
}

void bootstrap();
