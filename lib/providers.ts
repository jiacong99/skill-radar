// Provider registry — SERVER ONLY. Where each agent runner keeps its skills.
// Built-in candidates are probed on every request; the user can add custom
// directories, persisted in the private (gitignored) data/local-dirs.md.

import fs from "fs";
import os from "os";
import path from "path";
import { readTable, DATA_DIR } from "./db";

export interface Provider {
  id: string; // stable id
  label: string; // display name
  skillsDir: string; // absolute dir where skill folders live
  pluginsDir?: string; // absolute dir with installed_plugins.json / known_marketplaces.json
  builtin: boolean;
  custom: boolean; // user-added (from local-dirs.md)
  exists: boolean; // skillsDir currently present on disk
}

const HOME = os.homedir();

// Agent runners we know how to scan. Each may or may not exist locally.
interface BuiltinSpec {
  id: string;
  label: string;
  home: string; // base config dir
  pluginsDir?: string;
}
const BUILTINS: BuiltinSpec[] = [
  { id: "claude", label: "Claude Code", home: path.join(HOME, ".claude"), pluginsDir: path.join(HOME, ".claude", "plugins") },
  { id: "codex", label: "Codex", home: path.join(HOME, ".codex") },
  { id: "chatgpt", label: "ChatGPT", home: path.join(HOME, ".chatgpt") },
  { id: "gemini", label: "Gemini CLI", home: path.join(HOME, ".gemini") },
];

export function dirExists(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

// Count skill folders directly under a skills dir (ignores dot/underscore dirs).
export function countSkills(dir: string): number {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith(".") && !d.name.startsWith("_")).length;
  } catch {
    return 0;
  }
}

// Custom directories the user added, from the private data/local-dirs.md.
// Columns: id | label | path
export function customProviders(): Provider[] {
  const t = readTable("local-dirs.md");
  if (!t) return [];
  return t.rows
    .filter((r) => (r.path || "").trim().length > 0)
    .map((r) => {
      const skillsDir = (r.path || "").trim();
      const id = (r.id || "").trim() || skillsDir;
      return {
        id,
        label: (r.label || "").trim() || path.basename(skillsDir) || id,
        skillsDir,
        builtin: false,
        custom: true,
        exists: dirExists(skillsDir),
      };
    });
}

// All providers = built-ins + custom. `exists` reflects the current disk state.
export function allProviders(): Provider[] {
  const builtins: Provider[] = BUILTINS.map((b) => ({
    id: b.id,
    label: b.label,
    skillsDir: path.join(b.home, "skills"),
    pluginsDir: b.pluginsDir,
    builtin: true,
    custom: false,
    exists: dirExists(path.join(b.home, "skills")),
  }));
  return [...builtins, ...customProviders()];
}

// Only providers whose skills dir actually exists — the ones we scan.
export function detectedProviders(): Provider[] {
  return allProviders().filter((p) => p.exists);
}

export function findProvider(id: string): Provider | undefined {
  return allProviders().find((p) => p.id === id);
}

// Append a custom skills directory to data/local-dirs.md (private, gitignored).
// Returns false with a reason if the row can't be added.
export function addCustomDir(label: string, dirPath: string): { ok: boolean; reason?: string } {
  const abs = path.resolve(dirPath.trim().replace(/^~(?=$|\/)/, HOME));
  if (!abs) return { ok: false, reason: "empty path" };
  const existing = customProviders();
  if (existing.some((p) => path.resolve(p.skillsDir) === abs)) {
    return { ok: false, reason: "already added" };
  }
  const id = slug(label) || slug(path.basename(abs)) || `dir-${existing.length + 1}`;
  const rows = [
    ...existing.map((p) => ({ id: p.id, label: p.label, path: p.skillsDir })),
    { id, label: label.trim() || path.basename(abs), path: abs },
  ];
  writeLocalDirs(rows);
  return { ok: true };
}

export function removeCustomDir(id: string): void {
  const rows = customProviders()
    .filter((p) => p.id !== id)
    .map((p) => ({ id: p.id, label: p.label, path: p.skillsDir }));
  writeLocalDirs(rows);
}

// Create a directory on disk (mkdir -p). Reversible, low-risk → allowed to auto-run.
export function createDir(dirPath: string): { ok: boolean; reason?: string } {
  const abs = path.resolve(dirPath.trim().replace(/^~(?=$|\/)/, HOME));
  try {
    fs.mkdirSync(abs, { recursive: true });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: (e?.message || "mkdir failed").toString().slice(0, 200) };
  }
}

function slug(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function writeLocalDirs(rows: { id: string; label: string; path: string }[]): void {
  const headers = ["id", "label", "path"];
  const esc = (v: string) => (v || "").replace(/\|/g, "\\|").trim();
  const head = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) => `| ${esc(r.id)} | ${esc(r.label)} | ${esc(r.path)} |`);
  const legend = [
    "# Local skill directories (private)",
    "",
    "> PRIVATE, gitignored. Custom skills directories you added in the Directories page.",
    "> Not pushed to the public repo.",
    "",
  ];
  fs.writeFileSync(path.join(DATA_DIR, "local-dirs.md"), [...legend, head, sep, ...body, ""].join("\n"), "utf8");
}
