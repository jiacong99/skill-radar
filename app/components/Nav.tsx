"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "./useRole";

const LINKS = [
  { href: "/dashboard", label: "总览" },
  { href: "/skills", label: "Skills" },
  { href: "/repos", label: "高星项目" },
  { href: "/news", label: "新闻" },
];

export default function Nav() {
  const pathname = usePathname();
  const { role, setRole } = useRole();

  return (
    <div className="nav">
      <Link href="/" className="brand">📡 Skill Radar</Link>
      <div className="links">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={pathname === l.href ? "active" : ""}>
            {l.label}
          </Link>
        ))}
      </div>
      <div className="spacer" />
      <div className="role-toggle">
        <span className="dim">角色：</span>
        <span className={`pill ${role === "developer" ? "on" : ""}`} onClick={() => setRole("developer")}>
          Developer
        </span>
        <span className={`pill ${role === "uiux" ? "on" : ""}`} onClick={() => setRole("uiux")}>
          UIUX
        </span>
      </div>
    </div>
  );
}
