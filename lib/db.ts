// markdown-as-database: read/parse/write the data/*.md tables.
// Defensive throughout — a missing or malformed file yields [] so the UI never
// crashes on a fresh clone (whitelist may be tiny, private files absent).

import fs from "fs";
import path from "path";
import type { WhitelistSkill, SearchedSkill } from "./types";

export const DATA_DIR = path.join(process.cwd(), "data");

export interface Table {
  headers: string[];
  rows: Record<string, string>[];
}

function splitRow(line: string): string[] {
  const t = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return t.split("|").map((c) => c.trim());
}

function isSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{2,}/.test(line) && line.includes("-");
}

// Parse the FIRST markdown table in the file. Returns null if none.
function parseTable(content: string): Table | null {
  const lines = content.split(/\r?\n/);
  let i = 0;
  for (; i < lines.length - 1; i++) {
    if (lines[i].trim().startsWith("|") && isSeparator(lines[i + 1])) break;
  }
  if (i >= lines.length - 1) return null;
  const headers = splitRow(lines[i]);
  const rows: Record<string, string>[] = [];
  for (let j = i + 2; j < lines.length; j++) {
    const line = lines[j];
    if (!line.trim().startsWith("|")) break;
    const cells = splitRow(line);
    const row: Record<string, string> = {};
    headers.forEach((h, k) => (row[h] = cells[k] ?? ""));
    rows.push(row);
  }
  return { headers, rows };
}

// Read + parse a data/<file>. Exported so providers.ts can reuse it.
export function readTable(file: string): Table | null {
  try {
    return parseTable(fs.readFileSync(path.join(DATA_DIR, file), "utf8"));
  } catch {
    return null;
  }
}

function num(v: string): number {
  const n = parseInt((v || "").replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function parseTags(v: string): string[] {
  return (v || "")
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function esc(v: string): string {
  return (v || "").replace(/\|/g, "\\|").replace(/\n/g, " ").trim();
}

// Normalize a github_path/url to "owner/repo".
export function normalizePath(input: string): string {
  let s = (input || "").trim();
  s = s.replace(/^https?:\/\/(www\.)?github\.com\//i, "");
  s = s.replace(/\.git$/i, "").replace(/\/$/, "");
  const parts = s.split("/").filter(Boolean);
  return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : s;
}

// ---- whitelist (data/whitelist.md, public, hand-edited only) ----
// Columns: name | github_path | description | tags | remark
export function getWhitelist(): WhitelistSkill[] {
  const t = readTable("whitelist.md");
  if (!t) return [];
  return t.rows
    .filter((r) => (r.name || r.github_path || "").trim().length > 0)
    .map((r) => ({
      name: (r.name || "").trim(),
      github_path: (r.github_path || "").trim(),
      description: (r.description || "").trim(),
      tags: parseTags(r.tags),
      remark: (r.remark || "").trim(),
    }));
}

// ---- searched (data/searched.md, PRIVATE gitignored, app-writable) ----
// Columns: name | github_path | stars | description | remark | saved_at
const SEARCHED_HEADERS = ["name", "github_path", "stars", "description", "remark", "saved_at"];

export function getSearched(): SearchedSkill[] {
  const t = readTable("searched.md");
  if (!t) return [];
  return t.rows
    .filter((r) => (r.github_path || r.name || "").trim().length > 0)
    .map((r) => ({
      name: (r.name || "").trim(),
      github_path: (r.github_path || "").trim(),
      description: (r.description || "").trim(),
      stars: num(r.stars),
      remark: (r.remark || "").trim(),
      saved_at: (r.saved_at || "").trim(),
    }));
}

function writeSearched(rows: SearchedSkill[]): void {
  const head = `| ${SEARCHED_HEADERS.join(" | ")} |`;
  const sep = `| ${SEARCHED_HEADERS.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) =>
    `| ${[esc(r.name), esc(r.github_path), String(r.stars || ""), esc(r.description), esc(r.remark), esc(r.saved_at)].join(" | ")} |`
  );
  const legend = [
    "# Searched skills (private)",
    "",
    "> PRIVATE, gitignored. GitHub results you looked at but didn't install.",
    "> Not pushed to the public repo.",
    "",
  ];
  fs.writeFileSync(path.join(DATA_DIR, "searched.md"), [...legend, head, sep, ...body, ""].join("\n"), "utf8");
}

// Save (or update) a searched entry. `saved_at` is passed in by the caller
// (routes stamp it) so this module stays free of Date for testability.
export function saveSearched(entry: SearchedSkill): void {
  const repo = normalizePath(entry.github_path);
  const rows = getSearched().filter((r) => normalizePath(r.github_path) !== repo);
  rows.push({ ...entry, github_path: repo });
  rows.sort((a, b) => a.name.localeCompare(b.name));
  writeSearched(rows);
}

export function removeSearched(github_path: string): void {
  const repo = normalizePath(github_path);
  writeSearched(getSearched().filter((r) => normalizePath(r.github_path) !== repo));
}
