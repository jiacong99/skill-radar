"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SkillView } from "@/lib/types";
import {
  githubUrl, filterSkills, sortSkills, allTags,
  type CategoryFilter, type SortBy, type SortDir,
} from "@/lib/rank";
import { useLang } from "../components/useClientPrefs";
import { t } from "@/lib/i18n";
import { getSkillPrefs, setSkillPrefs, defaultPrefs, type SkillPrefs } from "@/lib/store";

interface ProviderLite { id: string; label: string; skillsDir: string; }
const CATEGORIES: CategoryFilter[] = ["all", "installed", "whitelist", "searched"];

export default function SkillsClient({ views, providers, detected }: { views: SkillView[]; providers: ProviderLite[]; detected: boolean }) {
  const router = useRouter();
  const { lang } = useLang();
  const tr = (k: string, v?: Record<string, string | number>) => t(lang, k, v);

  const [draft, setDraft] = useState<SkillPrefs>(defaultPrefs());
  const [applied, setApplied] = useState<SkillPrefs>(defaultPrefs());
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [syncing, setSyncing] = useState(false);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState("");

  const [install, setInstall] = useState<SkillView | null>(null);
  const [installDir, setInstallDir] = useState<string>("");
  const [del, setDel] = useState<SkillView | null>(null);

  useEffect(() => {
    const p = getSkillPrefs();
    setDraft(p); setApplied(p);
    setSortBy(p.sortBy || "name"); setSortDir(p.sortDir || "asc");
  }, []);

  useEffect(() => { if (providers[0]) setInstallDir(providers[0].id); }, [providers]);

  const tags = useMemo(() => allTags(views), [views]);
  const view = useMemo(() => sortSkills(filterSkills(views, applied), sortBy, sortDir), [views, applied, sortBy, sortDir]);

  function applyFilters() { setApplied(draft); setSkillPrefs({ ...draft, sortBy, sortDir }); }
  function resetFilters() {
    const d = defaultPrefs();
    setDraft(d); setApplied(d); setSortBy(d.sortBy!); setSortDir(d.sortDir!); setSkillPrefs(d);
  }
  function changeSort(by: SortBy) {
    const dir = sortDir === "none" ? "asc" : sortDir;
    setSortBy(by); setSortDir(dir); setSkillPrefs({ ...getSkillPrefs(), sortBy: by, sortDir: dir });
  }
  function cycleDir() {
    const order: SortDir[] = ["asc", "desc", "none"];
    const next = order[(order.indexOf(sortDir) + 1) % 3];
    setSortDir(next); setSkillPrefs({ ...getSkillPrefs(), sortBy, sortDir: next });
  }

  const mark = (name: string, on: boolean) => setBusy((b) => ({ ...b, [name]: on }));

  async function syncAll() {
    if (!window.confirm(tr("act.confirmSync"))) return;
    setSyncing(true); setMsg("");
    try {
      const res = await fetch("/api/skills/sync", { method: "POST" });
      const data = await res.json();
      if (!data.available) { setMsg(data.reason || tr("act.onlyLocal")); return; }
      const ok = (data.results || []).filter((r: any) => r.ok && r.action === "updated").length;
      setMsg(`Updated ${ok} skill(s).`);
      router.refresh();
    } catch (e: any) { setMsg("Sync failed: " + (e?.message || "")); }
    finally { setSyncing(false); }
  }

  async function doInstall(s: SkillView, providerId: string) {
    mark(s.name, true); setMsg("");
    try {
      const res = await fetch("/api/skills/install", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: s.name, github_path: s.github_path, providerId }),
      });
      const data = await res.json();
      if (data.ok) { setInstall(null); setMsg(`${s.name}: ${data.result?.action || "installed"}.`); router.refresh(); }
      else setMsg(`${s.name}: ${data.result?.note || data.error || "install failed"}`);
    } catch (e: any) { setMsg(`${s.name}: ${e?.message || "failed"}`); }
    finally { mark(s.name, false); }
  }

  function openInstall(s: SkillView) {
    if (!s.github_path) { setMsg(tr("inst.noRepo")); return; }
    if (!providers.length) { setMsg(tr("inst.noDir")); return; }
    setInstall(s);
    setInstallDir(providers[0].id);
  }

  const rowKey = (s: SkillView) => `${s.category}:${s.github_path || s.name}`;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{tr("skills.title")}</h1>
          <p className="sub">{tr("skills.sub")}</p>
        </div>
        <div className="head-actions">
          <Link className="btn" href="/skills/search">🔍 {tr("skills.search")}</Link>
          <button className="btn" onClick={syncAll} disabled={syncing || !detected}>{syncing ? tr("skills.syncing") : "↻ " + tr("skills.sync")}</button>
        </div>
      </div>

      {!detected && (
        <div className="notice">
          {tr("inst.noDir")} <Link href="/directories">→ {tr("nav.directories")}</Link>
        </div>
      )}
      {msg && <div className="notice">{msg}</div>}

      <div className="filter-card">
        <div className="filter-grid">
          <div className="filter-field">
            <label>{tr("skills.keyword")}</label>
            <input className="input" value={draft.search || ""}
              onChange={(e) => setDraft({ ...draft, search: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()} />
          </div>
          <div className="filter-field">
            <label>{tr("skills.fCategory")}</label>
            <select className="input" value={draft.category || "all"} onChange={(e) => setDraft({ ...draft, category: e.target.value as CategoryFilter })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{tr(`cat.${c}`)}</option>)}
            </select>
          </div>
          <div className="filter-field">
            <label>{tr("skills.fTag")}</label>
            <select className="input" value={draft.tag || "all"} onChange={(e) => setDraft({ ...draft, tag: e.target.value })}>
              <option value="all">{tr("skills.allTags")}</option>
              {tags.map((tg) => <option key={tg} value={tg}>{tg}</option>)}
            </select>
          </div>
        </div>
        <div className="filter-actions">
          <button className="btn primary" onClick={applyFilters}>{tr("skills.apply")}</button>
          <button className="btn" onClick={resetFilters}>{tr("skills.reset")}</button>
        </div>
      </div>

      <div className="sort-bar">
        <span className="lbl">{tr("skills.sortBy")}</span>
        <select className="input" value={sortBy} onChange={(e) => changeSort(e.target.value as SortBy)}>
          <option value="name">{tr("skills.sort.name")}</option>
          <option value="stars">{tr("skills.sort.stars")}</option>
        </select>
        <button className="sort-dir" onClick={cycleDir} title={sortDir}>{sortDir === "desc" ? "↓" : sortDir === "asc" ? "↑" : "—"}</button>
      </div>

      {view.length === 0 ? (
        <div className="empty">{views.length === 0 ? tr("empty.noneAtAll") : tr("empty.noMatch")}</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{tr("col.skill")}</th>
                <th>{tr("col.category")}</th>
                <th>{tr("col.audience")}</th>
                <th>{tr("col.description")}</th>
                <th>{tr("col.action")}</th>
              </tr>
            </thead>
            <tbody>
              {view.map((s) => {
                const b = !!busy[s.name];
                return (
                  <tr key={rowKey(s)}>
                    <td className="skill-cell">
                      <div className="s-name">{s.name}</div>
                      <div className="s-meta">
                        {s.github_path
                          ? <a href={githubUrl(s.github_path)} target="_blank" rel="noreferrer">{s.github_path}</a>
                          : <span className="dim">{tr("common.local")}</span>}
                        {s.stars > 0 && <span className="s-star">★ {s.stars.toLocaleString()}</span>}
                      </div>
                      {s.installed && (
                        <div className="s-ver">
                          <span className="prov">{s.providerLabel}</span>
                          {s.version ? <span className="ver-num"> · v{s.version.replace(/^v/i, "")}</span> : null}
                        </div>
                      )}
                    </td>
                    <td className="nowrap"><span className={`cat cat-${s.category}`} title={tr(`cat.${s.category}.t`)}>{tr(`cat.${s.category}`)}</span></td>
                    <td className="tags-cell">
                      {s.tags.length ? s.tags.map((tg) => <span key={tg} className="tag">{tg}</span>) : <span className="dim">—</span>}
                    </td>
                    <td className="desc">
                      {s.description || <span className="dim">—</span>}
                      {s.remark && <div className="rmk">📝 {s.remark}</div>}
                    </td>
                    <td>
                      <div className="actions">
                        {s.github_path && <Link className="act-btn" title={tr("search.viewDetail")} href={`/skills/${s.github_path}`}>👁</Link>}
                        {!s.installed && s.github_path && (
                          <button className="act-btn" title={tr("act.install")} disabled={b || !detected} onClick={() => openInstall(s)}>⬇</button>
                        )}
                        {s.installed && s.github_path && (
                          <button className="act-btn" title={tr("act.update")} disabled={b} onClick={() => doInstall(s, s.provider || "")}>↻</button>
                        )}
                        {s.installed && (
                          <button className="act-btn del" title={tr("act.deleteGuide")} onClick={() => setDel(s)}>🗑</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {install && (
        <div className="modal-backdrop" onClick={() => setInstall(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{tr("inst.title", { name: install.name })}</h3>
            <p className="sub">{tr("inst.pickDir")}</p>
            <div className="field">
              <select className="input" value={installDir} onChange={(e) => setInstallDir(e.target.value)}>
                {providers.map((p) => <option key={p.id} value={p.id}>{p.label} — {p.skillsDir}</option>)}
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setInstall(null)}>{tr("inst.cancel")}</button>
              <button className="btn primary" disabled={!!busy[install.name]} onClick={() => doInstall(install, installDir)}>
                {busy[install.name] ? tr("act.installing") : tr("inst.go")}
              </button>
            </div>
          </div>
        </div>
      )}

      {del && <DeleteGuide skill={del} lang={lang} onClose={() => setDel(null)} />}
    </>
  );
}

function DeleteGuide({ skill, lang, onClose }: { skill: SkillView; lang: any; onClose: () => void }) {
  const tr = (k: string, v?: Record<string, string | number>) => t(lang, k, v);
  const [copied, setCopied] = useState(false);
  const isPlugin = skill.source === "plugin";
  const cmd = `rm -rf "${skill.dir}"`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(cmd); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{tr("del.title", { name: skill.name })}</h3>
        <p className="sub">{tr("del.intro")}</p>
        <div className="field">
          <label className="fl">{tr("del.folder")}</label>
          <code className="path-box">{skill.dir}</code>
        </div>
        {isPlugin ? (
          <div className="notice warn">{tr("del.pluginNote")}</div>
        ) : (
          <>
            <div className="field">
              <label className="fl">{tr("del.command")}</label>
              <div className="cmd-row">
                <code className="path-box">{cmd}</code>
                <button className="btn small" onClick={copy}>{copied ? tr("del.copied") : tr("del.copy")}</button>
              </div>
            </div>
            <div className="notice">{tr("del.gstackNote")}</div>
          </>
        )}
        <div className="modal-actions">
          <button className="btn primary" onClick={onClose}>{tr("del.close")}</button>
        </div>
      </div>
    </div>
  );
}
