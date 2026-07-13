// Browser-only preferences (localStorage): theme, language, and skills-page
// filter/sort. Guarded so SSR and private-mode degrade safely.

"use client";

import type { SkillFilters, SortBy, SortDir } from "./rank";
import type { Lang } from "./i18n";

export type Theme = "light" | "dark";

const KEYS = {
  theme: "gs.theme",
  lang: "gs.lang",
  prefs: "gs.skillPrefs",
};

let memFallback: Record<string, string> = {};

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return key in memFallback ? memFallback[key] : null;
  }
}
function write(key: string, val: string): void {
  try {
    window.localStorage.setItem(key, val);
  } catch {
    memFallback[key] = val;
  }
}
function readJson<T>(key: string, fallback: T): T {
  const raw = read(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ---- theme (default light) ----
export function getTheme(): Theme {
  return read(KEYS.theme) === "dark" ? "dark" : "light";
}
export function setTheme(t: Theme): void { write(KEYS.theme, t); }

// ---- language (default en) ----
export function getLang(): Lang {
  return read(KEYS.lang) === "cn" ? "cn" : "en";
}
export function setLang(l: Lang): void { write(KEYS.lang, l); }

// ---- skills page prefs ----
export interface SkillPrefs extends SkillFilters {
  sortBy?: SortBy;
  sortDir?: SortDir;
}
const DEFAULT_PREFS: SkillPrefs = { search: "", category: "all", tag: "all", sortBy: "name", sortDir: "asc" };
export function getSkillPrefs(): SkillPrefs { return { ...DEFAULT_PREFS, ...readJson<SkillPrefs>(KEYS.prefs, {}) }; }
export function setSkillPrefs(p: SkillPrefs): void { write(KEYS.prefs, JSON.stringify(p)); }
export function defaultPrefs(): SkillPrefs { return { ...DEFAULT_PREFS }; }
