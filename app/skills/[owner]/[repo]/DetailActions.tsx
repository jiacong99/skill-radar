"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "../../../components/useClientPrefs";
import { t } from "@/lib/i18n";

interface ProviderLite { id: string; label: string; skillsDir: string; }

export default function DetailActions({ full, name, description, stars, providers }:
  { full: string; name: string; description: string; stars: number; providers: ProviderLite[] }) {
  const router = useRouter();
  const { lang } = useLang();
  const tr = (k: string, v?: Record<string, string | number>) => t(lang, k, v);

  const [dir, setDir] = useState(providers[0]?.id || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function install() {
    if (!providers.length) { setMsg(tr("inst.noDir")); return; }
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/skills/install", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, github_path: full, providerId: dir }),
      });
      const data = await res.json();
      setMsg(data.ok ? `${data.result?.action || "installed"} → ${name}` : (data.result?.note || data.error || "install failed"));
      if (data.ok) router.refresh();
    } catch (e: any) { setMsg("install failed: " + (e?.message || "")); }
    finally { setBusy(false); }
  }

  async function save() {
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/searched/save", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, github_path: full, description, stars }),
      });
      const data = await res.json();
      setMsg(data.ok ? tr("detail.saved") : (data.error || "save failed"));
    } catch (e: any) { setMsg("save failed: " + (e?.message || "")); }
    finally { setBusy(false); }
  }

  return (
    <div className="detail-actions">
      <div className="da-row">
        {providers.length > 0 && (
          <select className="input" value={dir} onChange={(e) => setDir(e.target.value)}>
            {providers.map((p) => <option key={p.id} value={p.id}>{p.label} — {p.skillsDir}</option>)}
          </select>
        )}
        <button className="btn primary" onClick={install} disabled={busy || !providers.length}>{tr("detail.install")}</button>
        <button className="btn" onClick={save} disabled={busy}>{tr("detail.save")}</button>
      </div>
      {msg && <div className="notice">{msg}</div>}
    </div>
  );
}
