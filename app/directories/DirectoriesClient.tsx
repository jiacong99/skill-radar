"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "../components/useClientPrefs";
import { t } from "@/lib/i18n";

interface DirRow {
  id: string; label: string; path: string;
  builtin: boolean; custom: boolean; exists: boolean; count: number;
}

export default function DirectoriesClient({ dirs }: { dirs: DirRow[] }) {
  const router = useRouter();
  const { lang } = useLang();
  const tr = (k: string, v?: Record<string, string | number>) => t(lang, k, v);

  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState("");
  const [label, setLabel] = useState("");
  const [path, setPath] = useState("");
  const [adding, setAdding] = useState(false);

  const mark = (id: string, on: boolean) => setBusy((b) => ({ ...b, [id]: on }));

  async function post(url: string, body: any): Promise<any> {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return res.json();
  }

  async function createDir(d: DirRow) {
    mark(d.id, true); setMsg("");
    try {
      const data = await post("/api/directories/create", { path: d.path });
      if (data.ok) { setMsg(`Created ${d.path}`); router.refresh(); }
      else setMsg(data.error || "create failed");
    } finally { mark(d.id, false); }
  }

  async function removeDir(d: DirRow) {
    mark(d.id, true); setMsg("");
    try {
      const data = await post("/api/directories/remove", { id: d.id });
      if (data.ok) router.refresh(); else setMsg(data.error || "remove failed");
    } finally { mark(d.id, false); }
  }

  async function addDir() {
    if (!path.trim()) return;
    setAdding(true); setMsg("");
    try {
      const data = await post("/api/directories/add", { label, path });
      if (data.ok) { setLabel(""); setPath(""); router.refresh(); }
      else setMsg(data.reason || data.error || "add failed");
    } finally { setAdding(false); }
  }

  const detected = dirs.filter((d) => d.exists);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{tr("dir.title")}</h1>
          <p className="sub">{tr("dir.sub")}</p>
        </div>
      </div>

      {msg && <div className="notice">{msg}</div>}
      {detected.length === 0 && <div className="notice">{tr("dir.emptyDetected")}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{tr("dir.detected")}</th>
              <th>{tr("dir.addPath")}</th>
              <th>{tr("col.action")}</th>
            </tr>
          </thead>
          <tbody>
            {dirs.map((d) => (
              <tr key={d.id}>
                <td className="skill-cell">
                  <div className="s-name">
                    {d.label}{" "}
                    <span className={`cat ${d.custom ? "cat-searched" : "cat-whitelist"}`}>{d.custom ? tr("dir.custom") : tr("dir.builtin")}</span>
                  </div>
                  <div className="s-meta">
                    {d.exists
                      ? <span className="status active">{tr("dir.detected")} · {tr("dir.count", { n: d.count })}</span>
                      : <span className="dim">{tr("dir.notFound")}</span>}
                  </div>
                </td>
                <td><code className="path-box">{d.path}</code></td>
                <td>
                  <div className="actions">
                    {!d.exists && <button className="btn small" disabled={!!busy[d.id]} onClick={() => createDir(d)}>{busy[d.id] ? tr("dir.creating") : tr("dir.create")}</button>}
                    {d.custom && <button className="btn small" disabled={!!busy[d.id]} onClick={() => removeDir(d)}>{tr("dir.remove")}</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="filter-card">
        <h3 style={{ margin: "0 0 12px" }}>{tr("dir.addTitle")}</h3>
        <div className="filter-grid">
          <div className="filter-field">
            <label>{tr("dir.addLabel")}</label>
            <input className="input" value={label} placeholder={tr("dir.addLabelPh")} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="filter-field" style={{ gridColumn: "span 2" }}>
            <label>{tr("dir.addPath")}</label>
            <input className="input" value={path} placeholder={tr("dir.addPathPh")} onChange={(e) => setPath(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addDir()} />
          </div>
        </div>
        <div className="filter-actions">
          <button className="btn primary" disabled={adding} onClick={addDir}>{adding ? tr("dir.adding") : tr("dir.add")}</button>
        </div>
      </div>
    </>
  );
}
