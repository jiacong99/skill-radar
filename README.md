# 📡 Skill Radar — AI Intel Dashboard (skills / repos / news)

A **local-first, open-source** AI intelligence hub: it pulls the past 7 days' notable
**skills**, **high-star AI open-source projects**, and **Dev AI news** into a markdown
archive, with a **no-login** dashboard to browse, search, and track them.

- **Shared data** (name / path / stars / description / last update / latest version /
  per-role importance) lives in `data/*.md`, travels with the repo, usable by anyone who
  clones it.
- **Personal data** (what's installed on your machine, ignore / keep-track marks, the
  selected role, search prefs) lives in the **browser's localStorage** — never in markdown.
- **Data collection** does not run locally and calls no LLM API: a **cloud Claude routine**
  (`/schedule`) runs on a schedule or on manual trigger to collect + rate + write + push.
  The dashboard only **reads** and **scans the local machine's installs**.

## Roles
On entry, pick **Developer** or **UIUX** — the same data shows "importance" from the chosen
perspective. Switch any time from the top bar.

## Pages
- `/` — pick a role.
- `/dashboard` — overview (status counts, role-weighted top skills, recent news).
- `/skills` — main skills list: **search & filter** (keyword / status / importance),
  sort (stars / importance / last update, asc·desc·off), **Sync Skills**,
  **Add Skill** (modal, with optional auto-commit), and per-row sync / enable·disable / delete.
- `/repos` — high-star AI open-source projects.
- `/news` — Dev AI news.

Global controls (top bar): **light / dark theme** and **language (EN / 中文, default EN)**.

## Importance scale
Per-role (Developer / UIUX), set by the routine:
🟢 very important · 🔵 needed · 🟠 maybe needed · ⚫️ not needed.

## Skill status
| Status | Meaning |
|---|---|
| `installed` | Installed on this machine (from Sync Skills, stored in browser) |
| `open` | On the market, not installed, not disabled |
| `pending` | A link you added manually, awaiting the next routine to enrich |
| `disabled` | You disabled it — bulk **Sync Skills** skips it (still manually syncable) |

## Local actions (full-auto, local only)
**Sync Skills** installs/updates every non-disabled git skill on your machine;
per-row **sync** / **upgrade** / **delete** act on one skill (delete removes its
`~/.claude/skills/<name>` files, with a confirm). These run git on your machine and
only work locally — on a server they degrade with a clear message. Plugins/MCP can't
be auto-installed via shell and are reported with the command to run instead.

## Run locally
```bash
npm install
npm run dev      # http://localhost:3000
# or production:
npm run build && npm run start
```
- No `GITHUB_TOKEN`, no login (the app does not crawl GitHub locally).
- **Sync Skills** scans this machine's `~/.claude` (the skills dir,
  `installed_plugins.json`, `known_marketplaces.json`) to detect installs and versions —
  **only meaningful when running locally**.

## Updating data (cloud routine)
There is no local "crawl now". To get fresh data:
1. Push the repo to GitHub.
2. Per [`scripts/routine.md`](scripts/routine.md), create a daily 08:00 routine via
   `/schedule` (or trigger one manually).
3. The routine: pull → collect 3 sources → enrich pending → rate by Developer/UIUX →
   write `data/*.md` → commit & push.
4. Refresh the dashboard locally to see the new data.

## Deploy to Vercel (optional, future)
It can be deployed as a read-only board, but note:
- **Sync Skills / sync / upgrade / delete** can't reach a visitor's `~/.claude` on a
  server → they degrade to "local only".
- **Add Skill** needs to write `data/skills.md`; serverless filesystems are read-only
  → it degrades with a clear message.
- If `data/*.md` is missing, pages show an empty state instead of erroring.

## Data format
`data/*.md` are plain markdown tables (human-readable + parsed by `lib/db.ts`). Column
specs are in each file's first lines and in [`scripts/routine.md`](scripts/routine.md).

## Stack
Next.js 14 (App Router, TS) · markdown as the database · no backend DB · no login.

> Note: `npm audit` may flag advisories only fixable by upgrading to Next 16, which
> requires Node 20+. As a local board with no untrusted input, this stays on Next 14.2.x
> (compatible with Node 18.17). To clear them, move to Node 20 + `npm i next@latest`.
