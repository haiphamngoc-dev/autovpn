import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export function I18nLanguageSync() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const syncHtmlLanguage = (language: string) => {
      document.documentElement.lang = language;
    };

    syncHtmlLanguage(i18n.language);
    i18n.on("languageChanged", syncHtmlLanguage);

    return () => {
      i18n.off("languageChanged", syncHtmlLanguage);
    };
  }, [i18n]);

  return null;
}
