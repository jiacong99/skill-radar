# 📡 Skill Radar

A **local-first**, skills-only dashboard for your AI agent skills. It scans the skill
folders of your local agent runners (Claude Code, Codex, …), shows them next to a curated
whitelist and anything you've searched for, and lets you search GitHub and install new
skills — all from your machine. No login, no server, no data leaves your computer.

## What it does
- **Detects installed skills** across every agent runner it finds locally (Claude Code
  `~/.claude/skills` + plugins, Codex `~/.codex/skills`, and any directory you add).
- **Shows a whitelist** you curate by hand in `data/whitelist.md` — with free-text
  **audience tags** (who each skill suits: PM / BA / SE / QA / …). The UI has **no
  create/edit** for the whitelist; you change it by editing the file.
- **Searches GitHub** on demand for skills, opens a **detail page** with the rendered
  README, and installs the ones you want (git clone into the folder you pick).
- **Never deletes for you.** The 🗑 button opens a guide showing the skill's folder and the
  `rm` command to run yourself (plugins point you to `/plugin` instead).

Skills show up in one of three categories:

| Category | Meaning |
|---|---|
| **Installed** | Found on this machine in a detected skills directory |
| **Whitelist** | Curated in `data/whitelist.md` (edit the file to change) |
| **Searched** | A GitHub result you saved but didn't install |

## Pages
- `/skills` — the main table: installed + whitelist + searched, with keyword / category /
  audience filters, install, update, and the delete guide.
- `/skills/search` — search GitHub for skills.
- `/skills/<owner>/<repo>` — a skill's detail: rendered README + install / save.
- `/directories` — the skill directories per runner; add your own or create a missing one.

Top-bar controls: **light / dark theme** and **language (EN / 中文, default EN)**.

## Run locally
```bash
npm install
npm run dev        # http://localhost:5959
# or production:
npm run build && npm run start
```
It runs on **port 5959** (chosen to not collide with the usual :3000 dev servers).

- **No login. No data collection server.** Everything is read/scanned locally on demand.
- **GitHub search works unauthenticated** (subject to GitHub's low anonymous rate limit).
  To raise the limit, export a token in your environment before starting:
  ```bash
  export GITHUB_TOKEN=ghp_xxx   # optional; read from env only, never written to any file
  ```

## Public vs private data
- **Public (in git):** `data/whitelist.md` — the curated skill list you hand-maintain.
- **Private (gitignored, per-machine):**
  - `data/searched.md` — GitHub results you saved without installing.
  - `data/local-dirs.md` — custom skill directories you added on the Directories page.
- **Nothing about what you have installed is written to the repo** — installed skills are
  scanned live from disk each time you load the page.

A fresh `git clone` runs with just `data/whitelist.md`; the private files are created the
first time you add a searched entry or a custom directory.

## Editing the whitelist
Open `data/whitelist.md` and edit the table:

```
| name | github_path | description | tags | remark |
| gstack | garrytan/gstack | Claude Code engineering skills. | SE | |
```

- `name` — display name; also the key that matches an installed skill folder.
- `github_path` — `owner/repo`, used by the Install button.
- `tags` — comma-separated audience labels, any values you like.
- Reload the page to see changes. There is deliberately no UI to edit this file.

## Stack
Next.js 14 (App Router, TypeScript) · markdown as the data store · no backend DB · no login.

> `npm audit` may flag advisories only fixable by upgrading to Next 16 (Node 20+). As a
> local board with no untrusted input, this stays on Next 14.2.x (Node 18.17-compatible).
