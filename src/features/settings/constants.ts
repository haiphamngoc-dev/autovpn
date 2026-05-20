import { LANGUAGE_STORAGE_KEY } from "@shared/i18n/config";

export const STORAGE_KEYS = {
  language: LANGUAGE_STORAGE_KEY,
  appLockEnabled: "autovpn-app-lock-enabled",
  appLockIdleTimeout: "autovpn-app-lock-idle-timeout",
} as const;

export const LANGUAGE_VALUES = ["en", "vi"] as const;

export const IDLE_TIMEOUT_VALUES = ["1", "5", "15", "30", "60"] as const;

export const THEME_VALUES = ["light", "dark"] as const;
