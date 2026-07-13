// Pure logic: merge the three skill sources into one view, filter, sort.
// No browser/node APIs — safe on both server and client.

import type { InstalledSkill, WhitelistSkill, SearchedSkill, SkillView } from "./types";

// "owner/repo" -> https url
export function githubUrl(p: string): string {
  if (/^https?:\/\//i.test(p)) return p;
  return `https://github.com/${p.replace(/^\/+/, "")}`;
}

function repoKey(p: string): string {
  let s = (p || "").trim().replace(/^https?:\/\/(www\.)?github\.com\//i, "");
  s = s.replace(/\.git$/i, "").replace(/\/$/, "");
  const parts = s.split("/").filter(Boolean);
  return (parts.length >= 2 ? `${parts[0]}/${parts[1]}` : s).toLowerCase();
}

// Merge installed + whitelist + searched into one deduped list of view rows.
// Precedence: an installed skill absorbs matching whitelist tags/remark; a
// whitelist row that isn't installed stands on its own; a searched entry only
// appears when it isn't already installed or whitelisted.
export function buildSkillViews(
  installed: InstalledSkill[],
  whitelist: WhitelistSkill[],
  searched: SearchedSkill[]
): SkillView[] {
  const list: SkillView[] = [];
  const byName = new Map<string, SkillView>();
  const byRepo = new Map<string, SkillView>();

  const index = (v: SkillView) => {
    byName.set(v.name.toLowerCase(), v);
    if (v.github_path) byRepo.set(repoKey(v.github_path), v);
  };
  const find = (name: string, repo: string): SkillView | undefined =>
    byName.get(name.toLowerCase()) || (repo ? byRepo.get(repoKey(repo)) : undefined);

  for (const s of installed) {
    const v: SkillView = {
      name: s.name, github_path: s.github_path, description: s.description, category: "installed",
      installed: true, provider: s.provider, providerLabel: s.providerLabel, dir: s.dir,
      version: s.version, source: s.source, tags: [], stars: 0, remark: "",
    };
    list.push(v);
    index(v);
  }

  for (const w of whitelist) {
    const match = find(w.name, w.github_path);
    if (match) {
      if (w.tags.length) match.tags = w.tags;
      if (!match.remark) match.remark = w.remark;
      if (!match.description) match.description = w.description;
      if (!match.github_path) match.github_path = w.github_path;
      continue;
    }
    const v: SkillView = {
      name: w.name, github_path: w.github_path, description: w.description, category: "whitelist",
      installed: false, tags: w.tags, stars: 0, remark: w.remark,
    };
    list.push(v);
    index(v);
  }

  for (const e of searched) {
    const match = find(e.name || repoKey(e.github_path).split("/").pop() || "", e.github_path);
    if (match) {
      if (!match.remark) match.remark = e.remark;
      if (!match.stars) match.stars = e.stars;
      continue;
    }
    const v: SkillView = {
      name: e.name || repoKey(e.github_path).split("/").pop() || e.github_path,
      github_path: e.github_path, description: e.description, category: "searched",
      installed: false, tags: [], stars: e.stars, remark: e.remark,
    };
    list.push(v);
    index(v);
  }

  return list;
}

export type CategoryFilter = "all" | "installed" | "whitelist" | "searched";
export type SortBy = "name" | "stars";
export type SortDir = "none" | "asc" | "desc";

export interface SkillFilters {
  search?: string;
  category?: CategoryFilter;
  tag?: string; // "all" or a specific tag
}

export function allTags(rows: SkillView[]): string[] {
  const set = new Set<string>();
  for (const r of rows) for (const t of r.tags) set.add(t);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function filterSkills(rows: SkillView[], f: SkillFilters): SkillView[] {
  const q = (f.search || "").trim().toLowerCase();
  const cat = f.category || "all";
  const tag = f.tag || "all";
  return rows.filter((s) => {
    if (cat !== "all" && s.category !== cat) return false;
    if (tag !== "all" && !s.tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return false;
    if (q) {
      const hay = `${s.name} ${s.description} ${s.github_path} ${s.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function sortSkills(rows: SkillView[], by: SortBy, dir: SortDir): SkillView[] {
  if (dir === "none") return rows;
  const out = [...rows];
  const cmp = (a: SkillView, b: SkillView) => {
    if (by === "stars") return (a.stars || 0) - (b.stars || 0);
    return a.name.localeCompare(b.name);
  };
  out.sort((a, b) => (dir === "asc" ? cmp(a, b) : -cmp(a, b)));
  return out;
}
