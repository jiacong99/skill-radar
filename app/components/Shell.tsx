"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme, useLang } from "./useClientPrefs";
import { t } from "@/lib/i18n";

// App shell: sidebar (Skills / Directories) + header (theme + language).
export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang } = useLang();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  const tr = (k: string) => t(lang, k);
  const links = [
    { href: "/skills", label: tr("nav.skills"), ico: "🧩" },
    { href: "/directories", label: tr("nav.directories"), ico: "📁" },
  ];
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="app-shell">
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <Link href="/skills" className="brand">📡 Skill Radar</Link>
        <nav className="side-nav">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={isActive(l.href) ? "active" : ""}>
              <span className="ico">{l.ico}</span>{l.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <button className="icon-btn hamburger" onClick={() => setOpen((o) => !o)} title="Menu">☰</button>
          <div className="spacer" />
          <button className="lang-btn" onClick={toggleLang} title={tr("nav.lang")}>{lang === "en" ? "EN" : "中"}</button>
          <button className="icon-btn" onClick={toggleTheme} title={tr("nav.theme")}>{theme === "dark" ? "☀️" : "🌙"}</button>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
