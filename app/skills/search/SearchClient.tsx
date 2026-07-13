"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "../../components/useClientPrefs";
import { t } from "@/lib/i18n";
import type { GitHubRepo } from "@/lib/github";

export default function SearchClient({ installedKeys, whitelistKeys }: { installedKeys: string[]; whitelistKeys: string[] }) {
  const { lang } = useLang();
  const tr = (k: string, v?: Record<string, string | number>) => t(lang, k, v);

  const installed = new Set(installedKeys);
  const whitelisted = new Set(whitelistKeys);

  const [q, setQ] = useState("");
  const [items, setItems] = useState<GitHubRepo[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function run() {
    if (!q.trim()) return;
    setLoading(true); setMsg(""); setItems(null);
    try {
      const res = await fetch(`/api/github/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (data.rateLimited) { setMsg(tr("search.rateLimited")); return; }
      if (!data.ok) { setMsg(data.error || "search failed"); return; }
      setItems(data.items || []);
    } catch (e: any) { setMsg("search failed: " + (e?.message || "")); }
    finally { setLoading(false); }
  }

  const badge = (full: string, name: string) => {
    const nk = name.toLowerCase(), rk = full.toLowerCase();
    if (installed.has(nk) || installed.has(rk)) return <span className="cat cat-installed">{tr("search.installed")}</span>;
    if (whitelisted.has(nk) || whitelisted.has(rk)) return <span className="cat cat-whitelist">{tr("search.whitelisted")}</span>;
    return null;
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{tr("search.title")}</h1>
          <p className="sub"><Link href="/skills">← {tr("nav.skills")}</Link></p>
        </div>
      </div>

      <div className="filter-card">
        <div className="cmd-row">
          <input className="input" autoFocus value={q} placeholder={tr("search.ph")}
            onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()} />
          <button className="btn primary" onClick={run} disabled={loading}>{loading ? tr("search.searching") : tr("search.go")}</button>
        </div>
      </div>

      {msg && <div className="notice">{msg}</div>}

      {items === null ? (
        <div className="empty">{tr("search.empty")}</div>
      ) : items.length === 0 ? (
        <div className="empty">{tr("search.noResults")}</div>
      ) : (
        <div className="result-list">
          {items.map((r) => (
            <Link key={r.full_name} href={`/skills/${r.full_name}`} className="result-card">
              <div className="rc-head">
                <span className="rc-name">{r.full_name}</span>
                {badge(r.full_name, r.name)}
                <span className="rc-star">★ {r.stars.toLocaleString()}</span>
              </div>
              <div className="rc-desc">{r.description || <span className="dim">—</span>}</div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
