"use client";

import { createContext, useContext, useState, useCallback } from "react";
import vi from "./locales/vi";
import en from "./locales/en";
import type { TranslationKeys, Translations } from "./locales/vi";

export type Locale = "vi" | "en";

const locales: Record<Locale, Translations> = { vi, en };

export const LOCALE_LABELS: Record<Locale, string> = {
  vi: "Tiếng Việt",
  en: "English",
};

const STORAGE_KEY = "hotel_locale";

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "vi";
  return (localStorage.getItem(STORAGE_KEY) as Locale) || "vi";
}

function setStoredLocale(locale: Locale) {
  localStorage.setItem(STORAGE_KEY, locale);
}

// ─── Context ───
type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKeys) => string;
};

export const I18nContext = createContext<I18nContextType | null>(null);

export function useI18nState() {
  const [locale, setLocaleState] = useState<Locale>(getStoredLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    setStoredLocale(l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: TranslationKeys) => locales[locale][key],
    [locale],
  );

  return { locale, setLocale, t };
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

export type { TranslationKeys };
