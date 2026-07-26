import { invoke } from "@tauri-apps/api/core";
import type { AppLanguage } from "@shared/i18n/config";
import { DEFAULT_LANGUAGE, isAppLanguage } from "@shared/i18n/config";
import type { MantineColorScheme } from "@mantine/core";

export type AppearanceSettings = {
  colorScheme: MantineColorScheme;
  language: AppLanguage;
};

export type SaveAppearanceSettingsResult = {
  settings: AppearanceSettings;
  persisted: boolean;
};

const DEFAULT_APPEARANCE: AppearanceSettings = {
  colorScheme: "dark",
  language: DEFAULT_LANGUAGE,
};

let cache: AppearanceSettings | null = null;

function normalizeColorScheme(
  value: MantineColorScheme | null | undefined
): AppearanceSettings["colorScheme"] {
  return value === "light" || value === "dark"
    ? value
    : DEFAULT_APPEARANCE.colorScheme;
}

function normalizeAppearance(
  appearance: Partial<AppearanceSettings> | null | undefined
): AppearanceSettings {
  return {
    colorScheme: normalizeColorScheme(appearance?.colorScheme),
    language: isAppLanguage(appearance?.language)
      ? appearance.language
      : DEFAULT_APPEARANCE.language,
  };
}

export async function loadAppearanceSettings(): Promise<AppearanceSettings> {
  if (cache) {
    return cache;
  }

  try {
    const appearance = await invoke<AppearanceSettings>(
      "get_appearance_settings"
    );
    cache = normalizeAppearance(appearance);
  } catch {
    cache = DEFAULT_APPEARANCE;
  }

  return cache;
}

export function getAppearanceSettingsCache(): AppearanceSettings {
  return cache ?? DEFAULT_APPEARANCE;
}

export async function saveAppearanceSettings(
  partial: Partial<AppearanceSettings>
): Promise<SaveAppearanceSettingsResult> {
  const next = normalizeAppearance({
    ...getAppearanceSettingsCache(),
    ...partial,
  });

  cache = next;

  try {
    await invoke("save_appearance_settings", { appearance: next });
    return { settings: next, persisted: true };
  } catch {
    return { settings: next, persisted: false };
  }
}
