import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LANGUAGE, isAppLanguage, type AppLanguage } from "./config";
import en from "./locales/en.json";
import vi from "./locales/vi.json";

export async function initI18n(
  initialLanguage: AppLanguage = DEFAULT_LANGUAGE
) {
  if (i18n.isInitialized) {
    await i18n.changeLanguage(initialLanguage);
    return i18n;
  }

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      vi: { translation: vi },
    },
    lng: initialLanguage,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
  });

  return i18n;
}

export async function changeAppLanguage(
  language: string
): Promise<AppLanguage> {
  const nextLanguage = isAppLanguage(language) ? language : DEFAULT_LANGUAGE;
  await i18n.changeLanguage(nextLanguage);
  return nextLanguage;
}

export { i18n };
export { DEFAULT_LANGUAGE, isAppLanguage, type AppLanguage } from "./config";
