import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { AppLanguage } from "./config";

export function useThemeOptions() {
  const { t } = useTranslation();

  return useMemo(
    () => [
      { label: t("settings.theme.light"), value: "light" },
      { label: t("settings.theme.dark"), value: "dark" },
    ],
    [t]
  );
}

export function useLanguageOptions() {
  const { t } = useTranslation();

  return useMemo(
    () => [
      { label: t("settings.languages.en"), value: "en" satisfies AppLanguage },
      { label: t("settings.languages.vi"), value: "vi" satisfies AppLanguage },
    ],
    [t]
  );
}

export function useIdleTimeoutOptions() {
  const { t } = useTranslation();

  return useMemo(
    () => [
      { value: "1", label: t("settings.idleTimeout.1min") },
      { value: "5", label: t("settings.idleTimeout.5min") },
      { value: "15", label: t("settings.idleTimeout.15min") },
      { value: "30", label: t("settings.idleTimeout.30min") },
      { value: "60", label: t("settings.idleTimeout.1hour") },
    ],
    [t]
  );
}
