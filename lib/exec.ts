// LOCAL-ONLY shell actions. Runs git on the user's machine to install (clone)
// and update (pull) skills. Guarded: names are sanitised, clone targets are
// confined to a known provider skills dir. There is NO delete here by design —
// deletion is guide-only (the UI shows the folder + command; the user runs it).

import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { githubUrl } from "./rank";
import { listInstalledSkills } from "./detect";

const pexec = promisify(execFile);

function safeName(name: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(name) && name !== "." && name !== "..";
}

export interface ActionResult {
  name: string;
  ok: boolean;
  action?: "installed" | "updated" | "skipped";
  note?: string;
}

// Clone (or ff-pull) a git skill into <skillsDir>/<name>.
export async function installOrUpgrade(name: string, github_path: string, skillsDir: string): Promise<ActionResult> {
  if (!safeName(name)) return { name, ok: false, note: "invalid skill name" };
  const repo = (github_path || "").trim();
  if (!repo) return { name, ok: false, note: "no GitHub repo for this skill" };

  const target = path.join(skillsDir, name);
  const url = githubUrl(repo);
  try {
    fs.mkdirSync(skillsDir, { recursive: true });
    if (fs.existsSync(target)) {
      await pexec("git", ["-C", target, "pull", "--ff-only"], { timeout: 90_000 });
      return { name, ok: true, action: "updated" };
    }
    await pexec("git", ["clone", "--depth", "1", url, target], { timeout: 120_000 });
    return { name, ok: true, action: "installed" };
  } catch (e: any) {
    return { name, ok: false, note: (e?.stderr || e?.message || "git failed").toString().slice(0, 200) };
  }
}

// Update every installed skill that is a git checkout (ff-pull). Non-git dirs and
// plugins are skipped. Operates on the live-scanned installed set.
export async function syncInstalled(): Promise<ActionResult[]> {
  const out: ActionResult[] = [];
  for (const s of listInstalledSkills()) {
    if (s.source === "plugin") {
      out.push({ name: s.name, ok: true, action: "skipped", note: "plugin — manage via /plugin" });
      continue;
    }
    if (!fs.existsSync(path.join(s.dir, ".git"))) {
      out.push({ name: s.name, ok: true, action: "skipped", note: "not a git checkout" });
      continue;
    }
    try {
      await pexec("git", ["-C", s.dir, "pull", "--ff-only"], { timeout: 90_000 });
      out.push({ name: s.name, ok: true, action: "updated" });
    } catch (e: any) {
      out.push({ name: s.name, ok: false, note: (e?.stderr || e?.message || "pull failed").toString().slice(0, 200) });
    }
  }
  return out;
}
