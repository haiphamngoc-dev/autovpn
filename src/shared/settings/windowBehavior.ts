import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

export type WindowBehaviorSettings = {
  useSystemWindowFrame: boolean;
  closeToTray: boolean;
};

export type SaveWindowBehaviorSettingsResult = {
  settings: WindowBehaviorSettings;
  persisted: boolean;
};

const DEFAULT_WINDOW_BEHAVIOR: WindowBehaviorSettings = {
  useSystemWindowFrame: false,
  closeToTray: false,
};

let cache: WindowBehaviorSettings | null = null;

function normalizeWindowBehavior(
  settings: Partial<WindowBehaviorSettings> | null | undefined
): WindowBehaviorSettings {
  return {
    useSystemWindowFrame:
      settings?.useSystemWindowFrame ??
      DEFAULT_WINDOW_BEHAVIOR.useSystemWindowFrame,
    closeToTray: settings?.closeToTray ?? DEFAULT_WINDOW_BEHAVIOR.closeToTray,
  };
}

export async function loadWindowBehaviorSettings(): Promise<WindowBehaviorSettings> {
  if (cache) {
    return cache;
  }

  try {
    const settings = await invoke<WindowBehaviorSettings>(
      "get_window_behavior_settings"
    );
    cache = normalizeWindowBehavior(settings);
  } catch {
    cache = DEFAULT_WINDOW_BEHAVIOR;
  }

  return cache;
}

export function getWindowBehaviorSettingsCache(): WindowBehaviorSettings {
  return cache ?? DEFAULT_WINDOW_BEHAVIOR;
}

export async function applyWindowBehaviorSettings(
  settings: WindowBehaviorSettings
): Promise<void> {
  const window = getCurrentWindow();
  await window.setDecorations(settings.useSystemWindowFrame);
}

export async function saveWindowBehaviorSettings(
  partial: Partial<WindowBehaviorSettings>
): Promise<SaveWindowBehaviorSettingsResult> {
  const next = normalizeWindowBehavior({
    ...getWindowBehaviorSettingsCache(),
    ...partial,
  });

  cache = next;

  try {
    await invoke("save_window_behavior_settings", { windowBehavior: next });
    await applyWindowBehaviorSettings(next);
    return { settings: next, persisted: true };
  } catch {
    try {
      await applyWindowBehaviorSettings(next);
    } catch {
      // Ignore apply errors when persistence already failed.
    }
    return { settings: next, persisted: false };
  }
}
