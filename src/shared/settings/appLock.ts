import { invoke } from "@tauri-apps/api/core";
import { IDLE_TIMEOUT_VALUES } from "@features/settings/constants";

export type AppLockSettings = {
  lockWhenIdle: boolean;
  idleTimeout: (typeof IDLE_TIMEOUT_VALUES)[number];
};

export type SaveAppLockSettingsResult = {
  settings: AppLockSettings;
  persisted: boolean;
};

const DEFAULT_APP_LOCK: AppLockSettings = {
  lockWhenIdle: true,
  idleTimeout: "5",
};

let cache: AppLockSettings | null = null;

function isIdleTimeout(
  value: string | null | undefined
): value is AppLockSettings["idleTimeout"] {
  return IDLE_TIMEOUT_VALUES.includes(value as AppLockSettings["idleTimeout"]);
}

function normalizeAppLock(
  settings: Partial<AppLockSettings> | null | undefined
): AppLockSettings {
  return {
    lockWhenIdle: settings?.lockWhenIdle ?? DEFAULT_APP_LOCK.lockWhenIdle,
    idleTimeout: isIdleTimeout(settings?.idleTimeout)
      ? settings.idleTimeout
      : DEFAULT_APP_LOCK.idleTimeout,
  };
}

export async function loadAppLockSettings(): Promise<AppLockSettings> {
  if (cache) {
    return cache;
  }

  try {
    const settings = await invoke<AppLockSettings>("get_app_lock_settings");
    cache = normalizeAppLock(settings);
  } catch {
    cache = DEFAULT_APP_LOCK;
  }

  return cache;
}

export function getAppLockSettingsCache(): AppLockSettings {
  return cache ?? DEFAULT_APP_LOCK;
}

export async function saveAppLockSettings(
  partial: Partial<AppLockSettings>
): Promise<SaveAppLockSettingsResult> {
  const next = normalizeAppLock({
    ...getAppLockSettingsCache(),
    ...partial,
  });

  cache = next;

  try {
    await invoke("save_app_lock_settings", { appLock: next });
    return { settings: next, persisted: true };
  } catch {
    return { settings: next, persisted: false };
  }
}

export async function hasAppLockPin(): Promise<boolean> {
  try {
    return await invoke<boolean>("has_app_lock_pin");
  } catch {
    return false;
  }
}

export function getInvokeErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "unknown";
}

export async function setAppLockPin(pin: string): Promise<void> {
  await invoke("set_app_lock_pin", { pin });
}

export async function verifyAppLockPin(pin: string): Promise<boolean> {
  try {
    return await invoke<boolean>("verify_app_lock_pin", { pin });
  } catch {
    return false;
  }
}

export async function removeAppLockPin(): Promise<void> {
  await invoke("remove_app_lock_pin");
}
