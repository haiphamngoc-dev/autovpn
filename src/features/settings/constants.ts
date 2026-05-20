export const STORAGE_KEYS = {
  language: "autovpn-language",
  appLockEnabled: "autovpn-app-lock-enabled",
  appLockIdleTimeout: "autovpn-app-lock-idle-timeout",
} as const;

export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "vi", label: "Tiếng Việt" },
] as const;

export const IDLE_TIMEOUT_OPTIONS = [
  { value: "1", label: "1 min" },
  { value: "5", label: "5 min" },
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "60", label: "1 hour" },
] as const;

export const THEME_OPTIONS = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
] as const;
