// Local install detection — SERVER ONLY. Scans each detected provider's skills
// dir for installed skills (+ Claude plugins), enriched with SKILL.md metadata.
// This is personal data derived live from disk; it's never written to the repo.

import fs from "fs";
import path from "path";
import type { InstalledSkill } from "./types";
import { normalizePath } from "./db";
import { detectedProviders, type Provider } from "./providers";

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

// Read a skill's SKILL.md frontmatter for version + description (no network).
function readSkillMeta(dir: string): { version: string; description: string } {
  try {
    const txt = fs.readFileSync(path.join(dir, "SKILL.md"), "utf8");
    const lines = txt.split(/\r?\n/);
    let start = -1, end = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === "---") { if (start < 0) start = i; else { end = i; break; } }
    }
    const fm = start >= 0 && end > start ? lines.slice(start + 1, end) : lines.slice(0, 40);
    let version = "", description = "";
    for (const ln of fm) {
      const v = ln.match(/^version:\s*(.+)$/i);
      const d = ln.match(/^description:\s*(.+)$/i);
      if (v && !version) version = v[1].trim().replace(/^["']|["']$/g, "");
      if (d && !description) description = d[1].trim().replace(/^["']|["']$/g, "").slice(0, 240);
    }
    return { version, description };
  } catch {
    return { version: "", description: "" };
  }
}

// Claude plugins: name -> { version, repo }, resolved via known_marketplaces + installed_plugins.
function claudePlugins(pluginsDir: string): Map<string, { version: string; repo: string }> {
  const out = new Map<string, { version: string; repo: string }>();
  const marketRepo = new Map<string, string>(); // marketplace name(lower) -> owner/repo
  const km = safeJson(path.join(pluginsDir, "known_marketplaces.json"));
  if (km && typeof km === "object")
    for (const [m, info] of Object.entries<any>(km))
      if (info?.source?.repo) marketRepo.set(m.toLowerCase(), normalizePath(info.source.repo));

  const ip = safeJson(path.join(pluginsDir, "installed_plugins.json"));
  if (ip?.plugins && typeof ip.plugins === "object")
    for (const [key, entries] of Object.entries<any>(ip.plugins)) {
      const [plugin, market] = key.split("@");
      if (!plugin) continue;
      const version = Array.isArray(entries) && entries[0]?.version ? String(entries[0].version) : "";
      const repo = market ? marketRepo.get(market.toLowerCase()) || "" : "";
      out.set(plugin.toLowerCase(), { version, repo });
    }
  return out;
}

function scanProvider(p: Provider): InstalledSkill[] {
  const out = new Map<string, InstalledSkill>();

  // 1) Claude plugins (only Claude tracks these).
  const plugins = p.pluginsDir ? claudePlugins(p.pluginsDir) : new Map();
  for (const [name, info] of plugins) {
    out.set(name, {
      name, version: info.version, description: "", provider: p.id, providerLabel: p.label,
      dir: path.join(p.skillsDir, name), source: "plugin", github_path: info.repo,
    });
  }

  // 2) skill directories under the provider's skills dir.
  for (const d of safeDirs(p.skillsDir)) {
    if (d.startsWith(".") || d.startsWith("_")) continue;
    const dir = path.join(p.skillsDir, d);
    const meta = readSkillMeta(dir);
    const ex = out.get(d.toLowerCase());
    if (ex) {
      out.set(d.toLowerCase(), { ...ex, dir, version: ex.version || meta.version, description: ex.description || meta.description });
    } else {
      out.set(d.toLowerCase(), {
        name: d, version: meta.version, description: meta.description, provider: p.id,
        providerLabel: p.label, dir, source: "skill", github_path: "",
      });
    }
  }

  return Array.from(out.values());
}

// Every installed skill across every detected provider. Deduped by lowercased
// name (first provider wins), so the same skill in two runners shows once.
export function listInstalledSkills(): InstalledSkill[] {
  const seen = new Set<string>();
  const out: InstalledSkill[] = [];
  for (const p of detectedProviders()) {
    for (const s of scanProvider(p)) {
      const key = s.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(s);
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export function anyProviderDetected(): boolean {
  return detectedProviders().length > 0;
}
