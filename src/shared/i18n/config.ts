export const LANGUAGE_STORAGE_KEY = "autovpn-language";

export const SUPPORTED_LANGUAGES = ["en", "vi"] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: AppLanguage = "en";

export function isAppLanguage(
  value: string | null | undefined
): value is AppLanguage {
  return value === "en" || value === "vi";
}

export function getStoredLanguage(): AppLanguage {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return isAppLanguage(stored) ? stored : DEFAULT_LANGUAGE;
}
