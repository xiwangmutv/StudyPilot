"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getMessages, type Locale, type Messages } from "@/lib/i18n";

type LanguageContextValue = { locale: Locale; messages: Messages; setLocale: (locale: Locale) => void };
const LanguageContext = createContext<LanguageContextValue | null>(null);

function detectLocale(): Locale {
  const saved = window.localStorage.getItem("firstpilot-locale");
  if (saved === "zh" || saved === "en") return saved;
  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  useEffect(() => setLocale(detectLocale()), []);
  useEffect(() => { document.documentElement.lang = locale === "zh" ? "zh-CN" : "en"; window.localStorage.setItem("firstpilot-locale", locale); }, [locale]);
  const value = useMemo(() => ({ locale, messages: getMessages(locale), setLocale }), [locale]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
