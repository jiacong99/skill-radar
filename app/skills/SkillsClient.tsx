"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { SkillRow, LocalSkillMap, Importance, Status } from "@/lib/types";
import {
  computeStatus,
  latestState,
  importanceFor,
  filterSkills,
  sortRows,
  githubUrl,
  syncCommand,
  statusLabel,
  type SortBy,
  type PersonalSkillState,
} from "@/lib/rank";
import { useRole } from "../components/useRole";
import {
  getLocalSkills,
  setLocalSkills,
  getLocalAvailable,
  setLocalAvailable,
  getPersonalMap,
  toggleIgnore,
  toggleKeepTrack,
  getSkillPrefs,
  setSkillPrefs,
  type SkillPrefs,
} from "@/lib/store";

type PersonalMap = Record<string, PersonalSkillState>;

export default function SkillsClient({ skills }: { skills: SkillRow[] }) {
  const router = useRouter();
  const { role } = useRole();

  const [localMap, setLocalMap] = useState<LocalSkillMap>({});
  const [localAvail, setLocalAvail] = useState<boolean | null>(null);
  const [personal, setPersonal] = useState<PersonalMap>({});
  const [prefs, setPrefs] = useState<SkillPrefs>({ search: "", status: "all", importance: "all", sort: "stars" });

  const [checking, setChecking] = useState(false);
  const [checkMsg, setCheckMsg] = useState("");
  const [link, setLink] = useState("");
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState("");

  // load personal state from browser cache
  useEffect(() => {
    setLocalMap(getLocalSkills());
    setLocalAvail(getLocalAvailable());
    setPersonal(getPersonalMap());
    setPrefs(getSkillPrefs());
  }, []);

  const updatePrefs = (p: Partial<SkillPrefs>) => {
    const next = { ...prefs, ...p };
    setPrefs(next);
    setSkillPrefs(next);
  };

  const statusOf = (s: SkillRow): Status =>
    computeStatus(s, localMap[s.name], personal[s.name]);

  const view = useMemo(() => {
    const filtered = filterSkills(skills, prefs, role, statusOf);
    return sortRows(filtered, (prefs.sort || "stars") as SortBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skills, prefs, role, localMap, personal]);

  async function checkLocal() {
    setChecking(true);
    setCheckMsg("");
    try {
      const res = await fetch("/api/local-skills", { cache: "no-store" });
      const data = await res.json();
      if (data.available) {
        setLocalMap(data.local);
        setLocalAvail(true);
        setLocalSkills(data.local);
        setLocalAvailable(true);
        const n = Object.values(data.local as LocalSkillMap).filter((v) => v.installed).length;
        setCheckMsg(`已检测：本机装了 ${n} 个。`);
      } else {
        setLocalAvail(false);
        setLocalAvailable(false);
        setCheckMsg(data.reason || "本地检测不可用。");
      }
    } catch (e: any) {
      setLocalAvail(false);
      setCheckMsg("检测失败：" + (e?.message || "网络错误"));
    } finally {
      setChecking(false);
    }
  }

  function onIgnore(name: string) {
    setPersonal({ ...toggleIgnore(name) });
  }
  function onKeep(name: string) {
    setPersonal({ ...toggleKeepTrack(name) });
  }

  async function onSync(s: SkillRow) {
    const cmd = syncCommand(s);
    try {
      await navigator.clipboard.writeText(cmd);
      alert("已复制安装命令：\n\n" + cmd);
    } catch {
      alert("安装命令：\n\n" + cmd);
    }
  }

  async function onAdd() {
    if (!link.trim()) return;
    setAdding(true);
    setAddMsg("");
    try {
      const res = await fetch("/api/skills/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link: link.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setLink("");
        setAddMsg("已加入，status = pending，等下次 routine 补全。");
        router.refresh();
      } else {
        setAddMsg(data.error || "加入失败");
      }
    } catch (e: any) {
      setAddMsg("加入失败：" + (e?.message || "网络错误"));
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <h1>Skills</h1>
      <p className="sub">明星 Claude / Agent skills。数据由云端 routine 维护；已装/忽略状态存在你浏览器。</p>

      {localAvail === false && (
        <div className="notice">本地已装检测不可用（{checkMsg || "非本地环境"}）。表格其余信息照常显示。</div>
      )}

      <div className="toolbar">
        <input
          className="input"
          placeholder="搜索 name / 描述 / repo…"
          value={prefs.search || ""}
          onChange={(e) => updatePrefs({ search: e.target.value })}
        />
        <select className="input" value={prefs.status || "all"} onChange={(e) => updatePrefs({ status: e.target.value as any })}>
          <option value="all">全部状态</option>
          <option value="open">open</option>
          <option value="active">active</option>
          <option value="pending">pending</option>
          <option value="expired">expired</option>
          <option value="cancelled">cancelled</option>
        </select>
        <select className="input" value={prefs.importance || "all"} onChange={(e) => updatePrefs({ importance: e.target.value as any })}>
          <option value="all">全部重要度</option>
          <option value="⚫️">⚫️ critical</option>
          <option value="🟠">🟠 high</option>
          <option value="🔵">🔵 medium</option>
          <option value="🟢">🟢 low</option>
        </select>
        <select className="input" value={prefs.sort || "stars"} onChange={(e) => updatePrefs({ sort: e.target.value as SortBy })}>
          <option value="stars">按 star 排序</option>
          <option value="updated">按更新时间排序</option>
        </select>
        <button className="btn" onClick={checkLocal} disabled={checking}>
          {checking ? "检测中…" : "Check local skills"}
        </button>
        {checkMsg && <span className="dim">{checkMsg}</span>}
        <span className="spacer" />
        <input
          className="input"
          placeholder="贴 GitHub link 加 skill…"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
        />
        <button className="btn primary" onClick={onAdd} disabled={adding}>
          {adding ? "加入中…" : "加 link"}
        </button>
      </div>
      {addMsg && <div className="notice">{addMsg}</div>}

      {view.length === 0 ? (
        <div className="empty">没有匹配的 skill。{skills.length === 0 && "（数据为空 —— 请从 Claude routine 触发一次更新）"}</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Skill</th>
                <th>GitHub</th>
                <th className="nowrap">Stars</th>
                <th>描述</th>
                <th className="nowrap">更新</th>
                <th className="nowrap">已装?</th>
                <th className="nowrap">最新?</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {view.map((s) => {
                const st = statusOf(s);
                const local = localMap[s.name];
                const ls = latestState(s, local);
                const p = personal[s.name] || {};
                const imp = importanceFor(s, role);
                return (
                  <tr key={s.github_path}>
                    <td className="nowrap">
                      <span title="重要度">{imp || "·"}</span> <strong>{s.name || s.github_path.split("/").pop()}</strong>
                      {p.keepTrack && <span title="keep track"> 📌</span>}
                    </td>
                    <td className="nowrap">
                      <a href={githubUrl(s.github_path)} target="_blank" rel="noreferrer">{s.github_path}</a>
                    </td>
                    <td className="nowrap">{s.stars ? "★ " + s.stars.toLocaleString() : "—"}</td>
                    <td className="desc">{s.description || <span className="dim">（待补全）</span>}</td>
                    <td className="nowrap">{s.last_update || "—"}</td>
                    <td className="nowrap">
                      {localAvail === null ? (
                        <span className="dim">未检测</span>
                      ) : local?.installed ? (
                        <span style={{ color: "var(--accent-2)" }}>✓ {local.version ? "v" + local.version : "已装"}</span>
                      ) : (
                        <span className="dim">—</span>
                      )}
                    </td>
                    <td className="nowrap">
                      {ls === "latest" && <span style={{ color: "var(--accent-2)" }}>✓ 最新</span>}
                      {ls === "outdated" && <span style={{ color: "var(--warn)" }}>↑ {s.latest_version}</span>}
                      {ls === "unknown" && <span className="dim">?</span>}
                      {ls === "n/a" && <span className="dim">—</span>}
                    </td>
                    <td><span className={`status ${st}`} title={statusLabel(st)}>{st}</span></td>
                    <td>
                      <div className="actions">
                        <button className="btn small" onClick={() => onSync(s)} title="复制安装命令">sync</button>
                        <button className="btn small" onClick={() => onIgnore(s.name)}>
                          {p.ignored ? "取消忽略" : "ignore"}
                        </button>
                        <button className="btn small" onClick={() => onKeep(s.name)}>
                          {p.keepTrack ? "取消跟踪" : "keep track"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
