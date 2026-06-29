// Pure logic: status computation, latest-version check, importance, sort & filter.
// No browser/node APIs — safe on both server and client.

import type { SkillRow, RepoRow, Role, Importance, Status, LocalSkillInfo } from "./types";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export interface PersonalSkillState {
  ignored?: boolean;
  keepTrack?: boolean;
}

export function isExpired(lastUpdate: string): boolean {
  if (!lastUpdate) return false;
  const t = Date.parse(lastUpdate);
  if (Number.isNaN(t)) return false;
  return Date.now() - t > ONE_YEAR_MS;
}

export function computeStatus(
  skill: SkillRow,
  local: LocalSkillInfo | undefined,
  personal: PersonalSkillState | undefined
): Status {
  if (skill.status === "pending") return "pending";
  if (personal?.ignored) return "cancelled";
  if (local?.installed) return "active";
  if (isExpired(skill.last_update)) return "expired";
  return "open";
}

export type LatestState = "n/a" | "unknown" | "latest" | "outdated";

export function latestState(skill: SkillRow, local: LocalSkillInfo | undefined): LatestState {
  if (!local?.installed) return "n/a";
  if (!skill.latest_version) return "unknown";
  if (!local.version) return "unknown";
  return normalizeVer(local.version) === normalizeVer(skill.latest_version) ? "latest" : "outdated";
}

function normalizeVer(v: string): string {
  return (v || "").trim().replace(/^v/i, "");
}

export function importanceFor(row: { importance_developer: Importance; importance_uiux: Importance }, role: Role): Importance {
  return role === "uiux" ? row.importance_uiux : row.importance_developer;
}

// For sorting: ⚫️ > 🟠 > 🔵 > 🟢 > 空
export function importanceRank(imp: Importance): number {
  switch (imp) {
    case "⚫️":
      return 4;
    case "🟠":
      return 3;
    case "🔵":
      return 2;
    case "🟢":
      return 1;
    default:
      return 0;
  }
}

export type SortBy = "stars" | "updated";

export function sortRows<T extends { stars: number; last_update: string }>(rows: T[], by: SortBy): T[] {
  const out = [...rows];
  if (by === "stars") {
    out.sort((a, b) => b.stars - a.stars);
  } else {
    out.sort((a, b) => (Date.parse(b.last_update) || 0) - (Date.parse(a.last_update) || 0));
  }
  return out;
}

export interface SkillFilters {
  search?: string;
  status?: Status | "all";
  importance?: Importance | "all";
}

// Filter skills. `statusOf` resolves each row's live status (needs personal/local state).
export function filterSkills(
  rows: SkillRow[],
  filters: SkillFilters,
  role: Role,
  statusOf: (s: SkillRow) => Status
): SkillRow[] {
  const q = (filters.search || "").trim().toLowerCase();
  return rows.filter((s) => {
    if (q) {
      const hay = `${s.name} ${s.description} ${s.github_path}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.status && filters.status !== "all" && statusOf(s) !== filters.status) return false;
    if (filters.importance && filters.importance !== "all" && importanceFor(s, role) !== filters.importance) return false;
    return true;
  });
}

// "owner/repo" -> https url
export function githubUrl(p: string): string {
  if (/^https?:\/\//i.test(p)) return p;
  return `https://github.com/${p.replace(/^\/+/, "")}`;
}

// Suggested install command for the sync action.
export function syncCommand(skill: SkillRow): string {
  const url = githubUrl(skill.github_path);
  if (skill.kind === "plugin") return `# Claude Code 里运行：\n/plugin install ${skill.name}`;
  if (skill.kind === "mcp") return `# 参考该 repo README 配置 MCP server：\n${url}`;
  // default: clone into ~/.claude/skills
  return `git clone ${url} ~/.claude/skills/${skill.name}`;
}

export function statusLabel(s: Status): string {
  switch (s) {
    case "pending":
      return "pending（待补全）";
    case "active":
      return "active（已装）";
    case "cancelled":
      return "cancelled（已忽略）";
    case "expired":
      return "expired（过期）";
    case "open":
      return "open（在架未装）";
    default:
      return "unknown";
  }
}

export function repoSorter(rows: RepoRow[], by: SortBy): RepoRow[] {
  return sortRows(rows, by);
}
