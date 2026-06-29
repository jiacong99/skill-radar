"use client";

import { useRouter } from "next/navigation";
import { useRole } from "./components/useRole";
import type { Role } from "@/lib/types";

export default function Landing() {
  const router = useRouter();
  const { setRole } = useRole();

  const pick = (r: Role) => {
    setRole(r);
    router.push("/dashboard");
  };

  return (
    <>
      <h1>选择你的角色</h1>
      <p className="sub">不同角色下，skills / 项目的「重要度」会按该视角显示。随时可在顶栏切换。</p>
      <div className="role-cards">
        <div className="role-card" onClick={() => pick("developer")}>
          <div className="emoji">🛠️</div>
          <div className="t">Developer</div>
          <div className="d">工程、框架、CLI、agent、基础设施类 skill 优先。</div>
        </div>
        <div className="role-card" onClick={() => pick("uiux")}>
          <div className="emoji">🎨</div>
          <div className="t">UIUX</div>
          <div className="d">设计系统、组件、视觉、原型、前端体验类 skill 优先。</div>
        </div>
      </div>
    </>
  );
}
