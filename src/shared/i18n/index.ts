import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import {
  DEFAULT_LANGUAGE,
  getStoredLanguage,
  isAppLanguage,
  LANGUAGE_STORAGE_KEY,
  type AppLanguage,
} from "./config";
import en from "./locales/en.json";
import vi from "./locales/vi.json";

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    vi: { translation: vi },
  },
  lng: getStoredLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
});

export function changeAppLanguage(language: string): AppLanguage {
  const nextLanguage = isAppLanguage(language) ? language : DEFAULT_LANGUAGE;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  void i18n.changeLanguage(nextLanguage);
  return nextLanguage;
}

export { i18n };
export {
  DEFAULT_LANGUAGE,
  getStoredLanguage,
  isAppLanguage,
  LANGUAGE_STORAGE_KEY,
  type AppLanguage,
} from "./config";
