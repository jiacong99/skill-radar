// Browser-only personal state (localStorage). Everything here is per-machine /
// per-person and must NOT be written to markdown. All access is guarded so SSR
// and private-mode (no localStorage) degrade to in-memory / defaults.

"use client";

import type { Role, LocalSkillMap } from "./types";
import type { PersonalSkillState, SkillFilters, SortBy } from "./rank";

const KEYS = {
  role: "gs.role",
  local: "gs.localSkills",
  localAvail: "gs.localAvailable",
  personal: "gs.personal", // { [skillName]: { ignored, keepTrack } }
  prefs: "gs.skillPrefs", // { search, status, importance, sort }
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
    memFallback[key] = val; // private mode → in-memory
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

export function localStorageAvailable(): boolean {
  try {
    const k = "__gs_test__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

// ---- role ----
export function getRole(): Role | null {
  const r = read(KEYS.role);
  return r === "developer" || r === "uiux" ? r : null;
}
export function setRole(r: Role): void {
  write(KEYS.role, r);
}

// ---- local skill detection cache ----
export function getLocalSkills(): LocalSkillMap {
  return readJson<LocalSkillMap>(KEYS.local, {});
}
export function setLocalSkills(map: LocalSkillMap): void {
  write(KEYS.local, JSON.stringify(map));
}
export function getLocalAvailable(): boolean | null {
  const v = read(KEYS.localAvail);
  return v === null ? null : v === "true";
}
export function setLocalAvailable(v: boolean): void {
  write(KEYS.localAvail, String(v));
}

// ---- personal marks (ignore / keep-track) ----
type PersonalMap = Record<string, PersonalSkillState>;
export function getPersonalMap(): PersonalMap {
  return readJson<PersonalMap>(KEYS.personal, {});
}
function savePersonalMap(m: PersonalMap): void {
  write(KEYS.personal, JSON.stringify(m));
}
export function toggleIgnore(name: string): PersonalMap {
  const m = getPersonalMap();
  const cur = m[name] || {};
  m[name] = { ...cur, ignored: !cur.ignored };
  savePersonalMap(m);
  return m;
}
export function toggleKeepTrack(name: string): PersonalMap {
  const m = getPersonalMap();
  const cur = m[name] || {};
  m[name] = { ...cur, keepTrack: !cur.keepTrack };
  savePersonalMap(m);
  return m;
}

// ---- skills page prefs ----
export interface SkillPrefs extends SkillFilters {
  sort?: SortBy;
}
export function getSkillPrefs(): SkillPrefs {
  return readJson<SkillPrefs>(KEYS.prefs, { search: "", status: "all", importance: "all", sort: "stars" });
}
export function setSkillPrefs(p: SkillPrefs): void {
  write(KEYS.prefs, JSON.stringify(p));
}
