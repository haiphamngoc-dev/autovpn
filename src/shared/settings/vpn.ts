import { invoke } from "@tauri-apps/api/core";

export type VpnProfileConfig = {
  username: string | null;
  useTotp: boolean;
  hasCredentials: boolean;
};

export type AutoReconnectSettings = {
  enabled: boolean;
  maxAttempts: number;
};

export type VpnSettings = {
  defaultProfile: string | null;
  profileConfigs: Record<string, VpnProfileConfig>;
  autoConnect: boolean;
  autoReconnect: AutoReconnectSettings;
};

export type SaveVpnSettingsResult = {
  settings: VpnSettings;
  persisted: boolean;
};

export type VpnProfileCredentialsView = {
  username: string;
  useTotp: boolean;
  basePassword: string;
  totpSecret: string;
  hasBasePassword: boolean;
  hasTotpSecret: boolean;
};

export type SaveVpnProfileCredentialsPayload = {
  profileName: string;
  username: string;
  useTotp: boolean;
  basePassword?: string;
  totpSecret?: string;
};

const DEFAULT_AUTO_RECONNECT: AutoReconnectSettings = {
  enabled: false,
  maxAttempts: 3,
};

const DEFAULT_VPN_SETTINGS: VpnSettings = {
  defaultProfile: null,
  profileConfigs: {},
  autoConnect: false,
  autoReconnect: DEFAULT_AUTO_RECONNECT,
};

let cache: VpnSettings | null = null;

function normalizeProfileConfig(
  config: Partial<VpnProfileConfig> | null | undefined
): VpnProfileConfig {
  const username = config?.username?.trim();

  return {
    username: username || null,
    useTotp: Boolean(config?.useTotp),
    hasCredentials: Boolean(config?.hasCredentials),
  };
}

function normalizeAutoReconnect(
  settings: Partial<AutoReconnectSettings> | null | undefined
): AutoReconnectSettings {
  const maxAttempts = Math.max(1, Math.min(10, settings?.maxAttempts ?? 3));

  return {
    enabled: Boolean(settings?.enabled),
    maxAttempts,
  };
}

function normalizeVpnSettings(
  settings: Partial<VpnSettings> | null | undefined
): VpnSettings {
  const defaultProfile = settings?.defaultProfile?.trim();
  const profileConfigs: Record<string, VpnProfileConfig> = {};

  for (const [name, config] of Object.entries(settings?.profileConfigs ?? {})) {
    const trimmedName = name.trim();

    if (!trimmedName) {
      continue;
    }

    profileConfigs[trimmedName] = normalizeProfileConfig(config);
  }

  return {
    defaultProfile: defaultProfile || null,
    profileConfigs,
    autoConnect: Boolean(settings?.autoConnect),
    autoReconnect: normalizeAutoReconnect(settings?.autoReconnect),
  };
}

export function getProfileConfig(
  settings: VpnSettings,
  profileName: string
): VpnProfileConfig | null {
  return settings.profileConfigs[profileName] ?? null;
}

export function isProfileReadyForConnect(
  settings: VpnSettings,
  profileName: string | null
): boolean {
  if (!profileName) {
    return false;
  }

  const config = getProfileConfig(settings, profileName);

  return Boolean(config?.hasCredentials && config.username);
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
    profileConfigs: {
      ...getVpnSettingsCache().profileConfigs,
      ...partial.profileConfigs,
    },
    autoReconnect: {
      ...getVpnSettingsCache().autoReconnect,
      ...partial.autoReconnect,
    },
  });

  cache = next;

  try {
    await invoke("save_vpn_settings", { vpn: next });
    return { settings: next, persisted: true };
  } catch {
    return { settings: next, persisted: false };
  }
}

export async function fetchVpnProfileCredentials(
  profileName: string
): Promise<VpnProfileCredentialsView> {
  return invoke<VpnProfileCredentialsView>("get_vpn_profile_credentials", {
    profileName,
  });
}

export async function saveVpnProfileCredentials(
  payload: SaveVpnProfileCredentialsPayload
): Promise<void> {
  await invoke("save_vpn_profile_credentials", { payload });
  invalidateVpnSettingsCache();
}

export async function removeVpnProfileCredentials(
  profileName: string
): Promise<void> {
  await invoke("remove_vpn_profile_credentials", { profileName });
  invalidateVpnSettingsCache();
}

export function invalidateVpnSettingsCache(): void {
  cache = null;
}
