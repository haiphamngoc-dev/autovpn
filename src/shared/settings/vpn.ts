import { invoke } from "@tauri-apps/api/core";

export type VpnSettings = {
  defaultProfile: string | null;
};

export type SaveVpnSettingsResult = {
  settings: VpnSettings;
  persisted: boolean;
};

const DEFAULT_VPN_SETTINGS: VpnSettings = {
  defaultProfile: null,
};

let cache: VpnSettings | null = null;

function normalizeVpnSettings(
  settings: Partial<VpnSettings> | null | undefined
): VpnSettings {
  const defaultProfile = settings?.defaultProfile?.trim();

  return {
    defaultProfile: defaultProfile || null,
  };
}

export async function loadVpnSettings(): Promise<VpnSettings> {
  if (cache) {
    return cache;
  }

  try {
    const settings = await invoke<VpnSettings>("get_vpn_settings");
    cache = normalizeVpnSettings(settings);
  } catch {
    cache = DEFAULT_VPN_SETTINGS;
  }

  return cache;
}

export function getVpnSettingsCache(): VpnSettings {
  return cache ?? DEFAULT_VPN_SETTINGS;
}

export async function saveVpnSettings(
  partial: Partial<VpnSettings>
): Promise<SaveVpnSettingsResult> {
  const next = normalizeVpnSettings({
    ...getVpnSettingsCache(),
    ...partial,
  });

  cache = next;

  try {
    await invoke("save_vpn_settings", { vpn: next });
    return { settings: next, persisted: true };
  } catch {
    return { settings: next, persisted: false };
  }
}

export function invalidateVpnSettingsCache(): void {
  cache = null;
}
