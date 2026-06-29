"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { SkillRow, RepoRow, NewsItem, LocalSkillMap, Status } from "@/lib/types";
import { computeStatus, importanceFor, importanceRank, githubUrl } from "@/lib/rank";
import type { PersonalSkillState } from "@/lib/rank";
import { useRole } from "../components/useRole";
import { getLocalSkills, getPersonalMap } from "@/lib/store";

type PersonalMap = Record<string, PersonalSkillState>;

export default function DashboardClient({
  skills,
  repos,
  news,
}: {
  skills: SkillRow[];
  repos: RepoRow[];
  news: NewsItem[];
}) {
  const { role } = useRole();
  const [localMap, setLocalMap] = useState<LocalSkillMap>({});
  const [personal, setPersonal] = useState<PersonalMap>({});

  useEffect(() => {
    setLocalMap(getLocalSkills());
    setPersonal(getPersonalMap());
  }, []);

  const counts = useMemo(() => {
    const c: Record<Status, number> = { open: 0, active: 0, pending: 0, expired: 0, cancelled: 0, unknown: 0 };
    for (const s of skills) c[computeStatus(s, localMap[s.name], personal[s.name])]++;
    return c;
  }, [skills, localMap, personal]);

  const topSkills = useMemo(
    () =>
      [...skills]
        .filter((s) => s.status !== "pending")
        .sort((a, b) => importanceRank(importanceFor(b, role)) - importanceRank(importanceFor(a, role)) || b.stars - a.stars)
        .slice(0, 5),
    [skills, role]
  );

  const recentNews = news.slice(0, 4);
  const empty = skills.length === 0 && repos.length === 0 && news.length === 0;

  return (
    <>
      <h1>总览</h1>
      <p className="sub">当前角色：<strong>{role === "uiux" ? "UIUX 🎨" : "Developer 🛠️"}</strong>（顶栏可切换）。</p>

      {empty && <div className="notice">还没有数据 —— 请从 Claude routine 触发一次更新，再回来看。</div>}

      <div className="cards">
        <Link className="card" href="/skills">
          <div className="big">{skills.length}</div>
          <div className="label">Skills 总数</div>
        </Link>
        <div className="card">
          <div className="big" style={{ color: "var(--accent-2)" }}>{counts.active}</div>
          <div className="label">active（本机已装）</div>
        </div>
        <div className="card">
          <div className="big" style={{ color: "var(--accent)" }}>{counts.open}</div>
          <div className="label">open（在架未装）</div>
        </div>
        <div className="card">
          <div className="big" style={{ color: "var(--warn)" }}>{counts.pending}</div>
          <div className="label">pending（待补全）</div>
        </div>
        <div className="card">
          <div className="big dim">{counts.expired}</div>
          <div className="label">expired（过期）</div>
        </div>
        <Link className="card" href="/repos">
          <div className="big">{repos.length}</div>
          <div className="label">高星项目</div>
        </Link>
        <Link className="card" href="/news">
          <div className="big">{news.length}</div>
          <div className="label">新闻</div>
        </Link>
      </div>

      <h2>重点 Skills（按 {role === "uiux" ? "UIUX" : "Developer"} 视角）</h2>
      {topSkills.length === 0 ? (
        <p className="dim">暂无。</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>重要度</th><th>Skill</th><th className="nowrap">Stars</th><th>描述</th></tr>
            </thead>
            <tbody>
              {topSkills.map((s) => (
                <tr key={s.github_path}>
                  <td className="nowrap">{importanceFor(s, role) || "·"}</td>
                  <td className="nowrap"><a href={githubUrl(s.github_path)} target="_blank" rel="noreferrer">{s.name}</a></td>
                  <td className="nowrap">{s.stars ? "★ " + s.stars.toLocaleString() : "—"}</td>
                  <td className="desc">{s.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2>最近新闻</h2>
      {recentNews.length === 0 ? (
        <p className="dim">暂无。</p>
      ) : (
        <ul>
          {recentNews.map((n, i) => (
            <li key={i} style={{ marginBottom: 6 }}>
              {n.url ? <a href={n.url} target="_blank" rel="noreferrer">{n.title}</a> : n.title}{" "}
              <span className="dim">— {n.source} · {n.date}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
