// Shared types. "Common" data lives in markdown (data/*.md); personal data
// (installed?, ignore/keep-track, role) lives in the browser (localStorage).

export type Role = "developer" | "uiux";

// Importance dots set by the cloud routine, per role.
// ⚫️ critical · 🟠 high · 🔵 medium · 🟢 low · "" unrated
export type Importance = "⚫️" | "🟠" | "🔵" | "🟢" | "";

// Raw status stored in markdown. "" = normal (live status computed at runtime),
// "pending" = user-added link awaiting routine enrichment.
export type RawStatus = "" | "pending";

// Final status shown in the UI (computed from common + personal state).
export type Status = "pending" | "active" | "cancelled" | "expired" | "open" | "unknown";

export interface SkillRow {
  name: string;
  github_path: string; // owner/repo or full URL
  stars: number;
  description: string;
  last_update: string; // ISO date, e.g. 2026-06-20
  latest_version: string;
  importance_developer: Importance;
  importance_uiux: Importance;
  status: RawStatus;
  // kind helps the "sync" action suggest the right install command.
  kind: "plugin" | "skill" | "mcp" | ""; // "" = unknown
}

export interface RepoRow {
  name: string;
  github_path: string;
  stars: number;
  description: string;
  last_update: string;
  importance_developer: Importance;
  importance_uiux: Importance;
}

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  date: string;
  summary: string;
}

// Personal install info returned by /api/local-skills (local only).
export interface LocalSkillInfo {
  installed: boolean;
  version: string; // best-effort local version, "" if unknown
}
export type LocalSkillMap = Record<string, LocalSkillInfo>; // keyed by skill name (lowercased)
