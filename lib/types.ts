// Shared types. Skill Radar is skills-only and local-first.
//
// Three sources of skills feed one unified table:
//  - installed : scanned live from each agent provider's skills dir (personal;
//                derived from disk, never written to the repo)
//  - whitelist : curated in data/whitelist.md, hand-edited by the maintainer only
//                (no create/edit in the UI)
//  - searched  : GitHub results the user looked at but didn't install, kept in the
//                private, gitignored data/searched.md

export type SkillCategory = "installed" | "whitelist" | "searched";

// A skill curated in data/whitelist.md. Audience tags say who it suits
// (PM / BA / SE / QA …) and are free text — maintained by editing the file only.
export interface WhitelistSkill {
  name: string;
  github_path: string; // owner/repo (may be empty)
  description: string;
  tags: string[]; // audience tags, free text
  remark: string; // maintainer note
}

// One skill found installed on this machine, scanned from a provider's dir.
export interface InstalledSkill {
  name: string;
  version: string; // best-effort from SKILL.md frontmatter / plugins json ("" if unknown)
  description: string; // best-effort from SKILL.md ("" if unknown)
  provider: string; // provider id, e.g. "claude"
  providerLabel: string; // e.g. "Claude Code"
  dir: string; // absolute path to the skill folder (used by the delete guide)
  source: "skill" | "plugin";
  github_path: string; // "" if unknown (resolved for plugins via known_marketplaces)
}

// A GitHub result the user saved without installing. Private (gitignored).
export interface SearchedSkill {
  name: string;
  github_path: string; // owner/repo
  description: string;
  stars: number;
  remark: string; // e.g. why not installing
  saved_at: string; // ISO date
}

// One row in the unified skills table. Merged from the three sources at render time.
export interface SkillView {
  name: string;
  github_path: string;
  description: string;
  category: SkillCategory;
  installed: boolean;
  // present when installed:
  provider?: string;
  providerLabel?: string;
  dir?: string;
  version?: string;
  source?: "skill" | "plugin";
  // whitelist-only:
  tags: string[];
  // stars from a searched entry, if any:
  stars: number;
  remark: string;
}
