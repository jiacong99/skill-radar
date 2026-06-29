"use client";

import { useMemo, useState } from "react";
import type { RepoRow } from "@/lib/types";
import { sortRows, importanceFor, githubUrl, type SortBy } from "@/lib/rank";
import { useRole } from "../components/useRole";

export default function ReposClient({ repos }: { repos: RepoRow[] }) {
  const { role } = useRole();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortBy>("stars");

  const view = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? repos.filter((r) => `${r.name} ${r.description} ${r.github_path}`.toLowerCase().includes(q))
      : repos;
    return sortRows(filtered, sort);
  }, [repos, search, sort]);

  return (
    <>
      <h1>高星 AI 开源项目</h1>
      <p className="sub">过去 7 天高星增长的 AI / Dev 项目。由云端 routine 维护。</p>

      <div className="toolbar">
        <input className="input" placeholder="搜索…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input" value={sort} onChange={(e) => setSort(e.target.value as SortBy)}>
          <option value="stars">按 star 排序</option>
          <option value="updated">按更新时间排序</option>
        </select>
      </div>

      {view.length === 0 ? (
        <div className="empty">暂无数据 —— 请从 Claude routine 触发一次更新。</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>项目</th>
                <th>GitHub</th>
                <th className="nowrap">Stars</th>
                <th>描述</th>
                <th className="nowrap">更新</th>
              </tr>
            </thead>
            <tbody>
              {view.map((r) => (
                <tr key={r.github_path}>
                  <td className="nowrap"><span title="重要度">{importanceFor(r, role) || "·"}</span> <strong>{r.name}</strong></td>
                  <td className="nowrap"><a href={githubUrl(r.github_path)} target="_blank" rel="noreferrer">{r.github_path}</a></td>
                  <td className="nowrap">{r.stars ? "★ " + r.stars.toLocaleString() : "—"}</td>
                  <td className="desc">{r.description}</td>
                  <td className="nowrap">{r.last_update || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
