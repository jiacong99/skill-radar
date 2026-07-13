"use client";

import { useCallback, useEffect, useState } from "react";
import { getTheme, setTheme as persistTheme, getLang, setLang as persistLang, type Theme } from "@/lib/store";
import type { Lang } from "@/lib/i18n";

const THEME_EVT = "gs-theme-change";
const LANG_EVT = "gs-lang-change";

function applyTheme(t: Theme) {
  document.documentElement.setAttribute("data-theme", t);
}

export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const t = getTheme();
    setThemeState(t);
    applyTheme(t);
    const h = (e: Event) => setThemeState((e as CustomEvent).detail as Theme);
    window.addEventListener(THEME_EVT, h);
    return () => window.removeEventListener(THEME_EVT, h);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      persistTheme(next);
      applyTheme(next);
      window.dispatchEvent(new CustomEvent(THEME_EVT, { detail: next }));
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}

export function useLang(): { lang: Lang; setLang: (l: Lang) => void; toggleLang: () => void } {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    setLangState(getLang());
    const h = (e: Event) => setLangState((e as CustomEvent).detail as Lang);
    window.addEventListener(LANG_EVT, h);
    return () => window.removeEventListener(LANG_EVT, h);
  }, []);

  const setLang = useCallback((l: Lang) => {
    persistLang(l);
    setLangState(l);
    window.dispatchEvent(new CustomEvent(LANG_EVT, { detail: l }));
  }, []);

  const toggleLang = useCallback(() => setLang(getLang() === "en" ? "cn" : "en"), [setLang]);

  return { lang, setLang, toggleLang };
}
