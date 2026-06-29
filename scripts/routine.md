# 云端 Routine — 数据采集与落档

这份文档是给**云端 Claude routine**（`/schedule` 创建的定时 agent，或手动触发的一次性
run）看的执行说明。Routine 跑在云端 checkout 上，**不接触任何人的本地 `~/.claude`**——
它只负责「发现 + 评级 + 写 markdown + push」。本地已装/版本检测是 dashboard 的事。

## 何时跑
- 默认每天 **08:00** 自动跑一次（覆盖过去 7 天）。
- Jiacong 也可**手动触发**一次 run 来即时刷新（这是唯一的取数方式，本地没有 crawl 按钮）。

## 输入 / 输出
- 输入：本 repo 现有的 `data/skills.md`（含用户手动加的 `status=pending` 行，要补全，**不可丢**）。
- 输出：更新后的 `data/skills.md`、`data/repos.md`、`data/news.md`，然后 `git commit && git push`。

## 步骤
1. `git pull`（拿到最新，包括用户新加的 pending 行）。
2. **采集三类来源**（用 GitHub REST/Search API、HN Algolia API 等；云端环境若有 `GITHUB_TOKEN`
   就带上以提高速率，没有也能跑）：
   - **Skills**：Claude/Agent skills 与 MCP server。来源建议：GitHub topic `claude-skill` /
     `claude-code` / `mcp-server`、awesome-claude 类清单、`anthropics/skills` 等市场。按
     **过去 7 天 star 增长**排，取 top N。
   - **高星 AI 项目**：GitHub Search，AI/Dev 相关，按近 7 天活跃 + 高 star，取 top N → `repos.md`。
   - **Dev AI 新闻**：HN front page（Algolia `search_by_date` + points 过滤）、主要 AI 厂商
     blog / release notes，取最近若干条 → `news.md`。
3. **补全 pending**：对每个 `status=pending` 行，抓该 repo 的 stars / description / 最近 push
   时间 / 最新 release 版本，填好各字段，把 `status` 清空（变正常行）。抓不到就保留 pending。
4. **按角色评级**（通用，不针对某个人）：给每行写 `importance_developer` 和 `importance_uiux`
   两列，用 ⚫️/🟠/🔵/🟢：
   - Developer 视角：工程/框架/CLI/agent/基础设施价值越高越靠 ⚫️。
   - UIUX 视角：设计系统/组件/视觉/原型/前端体验价值越高越靠 ⚫️。
5. **尊重个人态**：routine **不写**任何 installed / ignore 信息（那些只在用户浏览器里）。
   合并时按 `github_path` 去重，不要复活用户删掉的行、不要覆盖已有的人工修正。
6. **写回 markdown**：保持表头列顺序不变（见各文件第一行）。描述里的 `|` 要转义成 `\|`，不要换行。
7. `git add data && git commit -m "data: routine refresh $(date)" && git push`。

## 列规范（务必对齐 parser）
- `skills.md`：`name · github_path · stars · description · last_update · latest_version ·
  importance_developer · importance_uiux · status · kind`（`kind` ∈ plugin/skill/mcp/空）。
- `repos.md`：`name · github_path · stars · description · last_update · importance_developer · importance_uiux`。
- `news.md`：`title · url · source · date · summary`。
- 日期用 `YYYY-MM-DD`。`github_path` 用 `owner/repo`。

## 用 /schedule 创建（由 Jiacong 执行）
先把 repo push 到 GitHub，再在 Claude Code 里：

```
/schedule 每天 08:00 跑 Skill Radar 的数据采集 routine：
按 scripts/routine.md 的步骤 pull → 采集三类来源 → 补全 pending → 按 Developer/UIUX 评级 →
写 data/*.md → commit & push。
```

> 创建/触发 routine 属定时/对外操作，需 Jiacong 确认后再执行。
