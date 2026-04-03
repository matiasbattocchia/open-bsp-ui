import { useEffect } from "react";
import useBoundStore from "@/stores/useBoundStore";
import { getTranslation, loadTranslations } from "@/i18n/translations";

export function useTranslation() {
  const language = useBoundStore((state) => state.ui.language);
  const setLanguage = useBoundStore((state) => state.ui.setLanguage);

  useEffect(() => {
    loadTranslations(language);
  }, [language]);

  return {
    translate: (text: string) => getTranslation(text, language),
    currentLanguage: language,
    setCurrentLanguage: async (lang: "es" | "en" | "pt") => {
      await loadTranslations(lang);
      setLanguage(lang);
    },
  };
}
