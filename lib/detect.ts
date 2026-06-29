// Local install detection — LOCAL ONLY. Scans the current machine's
// ~/.claude install to decide whether each catalog skill is installed and at
// what version. This is *personal* data, so it never touches markdown — the
// API returns it to the browser, which caches it in localStorage.
//
// On a server (e.g. Vercel) there is no user ~/.claude, so detection reports
// "unavailable" and the UI degrades gracefully.

import fs from "fs";
import os from "os";
import path from "path";
import type { SkillRow, LocalSkillMap } from "./types";
import { normalizePath } from "./db";

const CLAUDE_DIR = path.join(os.homedir(), ".claude");

function safeJson(file: string): any {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function safeDirs(dir: string): string[] {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return [];
  }
}

export function claudeAvailable(): boolean {
  try {
    return fs.statSync(CLAUDE_DIR).isDirectory();
  } catch {
    return false;
  }
}

interface LocalIndex {
  repoToVersion: Map<string, string>; // "owner/repo" (lower) -> version ("" if unknown)
  names: Map<string, string>; // skill/plugin/marketplace name (lower) -> version
}

function buildIndex(): LocalIndex {
  const repoToVersion = new Map<string, string>();
  const names = new Map<string, string>();

  // 1) marketplaces: name -> github repo
  const marketRepo = new Map<string, string>(); // marketplace name(lower) -> repo(lower)
  const km = safeJson(path.join(CLAUDE_DIR, "plugins", "known_marketplaces.json"));
  if (km && typeof km === "object") {
    for (const [mName, info] of Object.entries<any>(km)) {
      const repo = info?.source?.repo ? normalizePath(info.source.repo).toLowerCase() : "";
      if (repo) {
        marketRepo.set(mName.toLowerCase(), repo);
        repoToVersion.set(repo, ""); // installed, version unknown until plugins json fills it
      }
      names.set(mName.toLowerCase(), "");
    }
  }

  // 2) installed plugins: "plugin@marketplace" -> version
  const ip = safeJson(path.join(CLAUDE_DIR, "plugins", "installed_plugins.json"));
  const plugins = ip?.plugins;
  if (plugins && typeof plugins === "object") {
    for (const [key, entries] of Object.entries<any>(plugins)) {
      const version = Array.isArray(entries) && entries[0]?.version ? String(entries[0].version) : "";
      const [pluginName, marketName] = key.split("@");
      if (pluginName) names.set(pluginName.toLowerCase(), version);
      if (marketName) {
        names.set(marketName.toLowerCase(), version);
        const repo = marketRepo.get(marketName.toLowerCase());
        if (repo) repoToVersion.set(repo, version);
      }
    }
  }

  // 3) skill directories under ~/.claude/skills (name-based, version unknown)
  for (const d of safeDirs(path.join(CLAUDE_DIR, "skills"))) {
    if (!names.has(d.toLowerCase())) names.set(d.toLowerCase(), "");
  }

  return { repoToVersion, names };
}

// Match each catalog skill against the local index. Keyed by skill name.
export function detectLocalSkills(skills: SkillRow[]): LocalSkillMap {
  const idx = buildIndex();
  const map: LocalSkillMap = {};
  for (const s of skills) {
    const repo = normalizePath(s.github_path).toLowerCase();
    const repoName = repo.split("/").pop() || "";
    const nameKey = s.name.toLowerCase();

    let installed = false;
    let version = "";

    if (repo && idx.repoToVersion.has(repo)) {
      installed = true;
      version = idx.repoToVersion.get(repo) || "";
    }
    for (const k of [nameKey, repoName]) {
      if (k && idx.names.has(k)) {
        installed = true;
        if (!version) version = idx.names.get(k) || "";
      }
    }

    map[s.name] = { installed, version };
  }
  return map;
}
