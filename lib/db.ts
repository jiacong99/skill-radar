// markdown-as-database: read/parse/write the data/*.md tables.
// All functions are defensive — a missing or malformed file yields [] (or a
// no-op write throwing a clear error), so the UI degrades gracefully (e.g. on
// Vercel where data may be absent, or before the first routine run).

import fs from "fs";
import path from "path";
import type { SkillRow, RepoRow, NewsItem, Importance, RawStatus } from "./types";

export const DATA_DIR = path.join(process.cwd(), "data");

interface Table {
  headers: string[];
  rows: Record<string, string>[];
}

// Split a markdown table row "| a | b |" into trimmed cells.
function splitRow(line: string): string[] {
  const t = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return t.split("|").map((c) => c.trim());
}

function isSeparator(line: string): boolean {
  // | --- | :---: | ...
  return /^\s*\|?\s*:?-{2,}/.test(line) && line.includes("-");
}

// Parse the FIRST markdown table found in the file. Returns null if no table.
function parseTable(content: string): Table | null {
  const lines = content.split(/\r?\n/);
  let i = 0;
  // find header row (a | line) followed by a separator line
  for (; i < lines.length - 1; i++) {
    if (lines[i].trim().startsWith("|") && isSeparator(lines[i + 1])) break;
  }
  if (i >= lines.length - 1) return null;
  const headers = splitRow(lines[i]);
  const rows: Record<string, string>[] = [];
  for (let j = i + 2; j < lines.length; j++) {
    const line = lines[j];
    if (!line.trim().startsWith("|")) break; // table ended
    const cells = splitRow(line);
    const row: Record<string, string> = {};
    headers.forEach((h, k) => (row[h] = cells[k] ?? ""));
    rows.push(row);
  }
  return { headers, rows };
}

function readTable(file: string): Table | null {
  try {
    const content = fs.readFileSync(path.join(DATA_DIR, file), "utf8");
    return parseTable(content);
  } catch {
    return null; // missing/unreadable → caller treats as empty
  }
}

function num(v: string): number {
  const n = parseInt((v || "").replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function imp(v: string): Importance {
  const t = (v || "").trim();
  return (["⚫️", "🟠", "🔵", "🟢"].includes(t) ? t : "") as Importance;
}

export function getSkills(): SkillRow[] {
  const t = readTable("skills.md");
  if (!t) return [];
  return t.rows
    .filter((r) => (r.github_path || "").trim().length > 0)
    .map((r) => ({
      name: (r.name || "").trim(),
      github_path: (r.github_path || "").trim(),
      stars: num(r.stars),
      description: (r.description || "").trim(),
      last_update: (r.last_update || "").trim(),
      latest_version: (r.latest_version || "").trim(),
      importance_developer: imp(r.importance_developer),
      importance_uiux: imp(r.importance_uiux),
      status: ((r.status || "").trim() === "pending" ? "pending" : "") as RawStatus,
      kind: (["plugin", "skill", "mcp"].includes((r.kind || "").trim())
        ? (r.kind || "").trim()
        : "") as SkillRow["kind"],
    }));
}

export function getRepos(): RepoRow[] {
  const t = readTable("repos.md");
  if (!t) return [];
  return t.rows
    .filter((r) => (r.github_path || "").trim().length > 0)
    .map((r) => ({
      name: (r.name || "").trim(),
      github_path: (r.github_path || "").trim(),
      stars: num(r.stars),
      description: (r.description || "").trim(),
      last_update: (r.last_update || "").trim(),
      importance_developer: imp(r.importance_developer),
      importance_uiux: imp(r.importance_uiux),
    }));
}

export function getNews(): NewsItem[] {
  const t = readTable("news.md");
  if (!t) return [];
  return t.rows
    .filter((r) => (r.title || "").trim().length > 0)
    .map((r) => ({
      title: (r.title || "").trim(),
      url: (r.url || "").trim(),
      source: (r.source || "").trim(),
      date: (r.date || "").trim(),
      summary: (r.summary || "").trim(),
    }));
}

// ---- write path (local only; used by /api/skills/add) ----

const SKILL_HEADERS = [
  "name",
  "github_path",
  "stars",
  "description",
  "last_update",
  "latest_version",
  "importance_developer",
  "importance_uiux",
  "status",
  "kind",
];

function esc(v: string): string {
  return (v || "").replace(/\|/g, "\\|").replace(/\n/g, " ").trim();
}

function serializeSkills(rows: SkillRow[]): string {
  const head = `| ${SKILL_HEADERS.join(" | ")} |`;
  const sep = `| ${SKILL_HEADERS.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) =>
    `| ${[
      esc(r.name),
      esc(r.github_path),
      String(r.stars || ""),
      esc(r.description),
      esc(r.last_update),
      esc(r.latest_version),
      r.importance_developer,
      r.importance_uiux,
      r.status,
      r.kind,
    ].join(" | ")} |`
  );
  const legend = [
    "# Skills",
    "",
    "> 共同数据，由云端 routine 维护。个人态（已装/ignore）存在浏览器，不写这里。",
    "> importance: ⚫️ critical · 🟠 high · 🔵 medium · 🟢 low · 空=未评。status: 空=正常 / pending=待 routine 补全。",
    "",
  ];
  return [...legend, head, sep, ...body, ""].join("\n");
}

// Normalize a github_path/url to "owner/repo" for de-dup.
export function normalizePath(input: string): string {
  let s = (input || "").trim();
  s = s.replace(/^https?:\/\/(www\.)?github\.com\//i, "");
  s = s.replace(/\.git$/i, "").replace(/\/$/, "");
  const parts = s.split("/").filter(Boolean);
  return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : s;
}

// Append a pending skill from a GitHub link. Returns the new row.
// Throws if the data file is not writable (e.g. on Vercel) — caller handles.
export function addPendingSkill(link: string): SkillRow {
  const github_path = normalizePath(link);
  if (!github_path.includes("/")) throw new Error("无法解析 GitHub link");
  const existing = getSkills();
  if (existing.some((s) => normalizePath(s.github_path) === github_path)) {
    throw new Error("这个 repo 已经在列表里");
  }
  const row: SkillRow = {
    name: github_path.split("/")[1],
    github_path,
    stars: 0,
    description: "",
    last_update: "",
    latest_version: "",
    importance_developer: "",
    importance_uiux: "",
    status: "pending",
    kind: "",
  };
  fs.writeFileSync(path.join(DATA_DIR, "skills.md"), serializeSkills([...existing, row]), "utf8");
  return row;
}
