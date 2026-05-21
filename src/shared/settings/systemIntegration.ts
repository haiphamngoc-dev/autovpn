import { invoke } from "@tauri-apps/api/core";

export type SystemIntegrationSettings = {
  launchAtStartup: boolean;
  launchMinimized: boolean;
};

export type SaveSystemIntegrationSettingsResult = {
  settings: SystemIntegrationSettings;
  persisted: boolean;
};

const DEFAULT_SYSTEM_INTEGRATION: SystemIntegrationSettings = {
  launchAtStartup: false,
  launchMinimized: false,
};

let cache: SystemIntegrationSettings | null = null;

function normalizeSystemIntegration(
  settings: Partial<SystemIntegrationSettings> | null | undefined
): SystemIntegrationSettings {
  return {
    launchAtStartup:
      settings?.launchAtStartup ?? DEFAULT_SYSTEM_INTEGRATION.launchAtStartup,
    launchMinimized:
      settings?.launchMinimized ?? DEFAULT_SYSTEM_INTEGRATION.launchMinimized,
  };
}

export async function loadSystemIntegrationSettings(): Promise<SystemIntegrationSettings> {
  if (cache) {
    return cache;
  }

  try {
    const settings = await invoke<SystemIntegrationSettings>(
      "get_system_integration_settings"
    );
    cache = normalizeSystemIntegration(settings);
  } catch {
    cache = DEFAULT_SYSTEM_INTEGRATION;
  }

  return cache;
}

export function getSystemIntegrationSettingsCache(): SystemIntegrationSettings {
  return cache ?? DEFAULT_SYSTEM_INTEGRATION;
}

export async function saveSystemIntegrationSettings(
  partial: Partial<SystemIntegrationSettings>
): Promise<SaveSystemIntegrationSettingsResult> {
  const next = normalizeSystemIntegration({
    ...getSystemIntegrationSettingsCache(),
    ...partial,
  });

  cache = next;

  try {
    await invoke("save_system_integration_settings", {
      systemIntegration: next,
    });
    return { settings: next, persisted: true };
  } catch {
    return { settings: next, persisted: false };
  }
}
