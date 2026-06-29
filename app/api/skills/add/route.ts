// POST /api/skills/add { link } — add a GitHub link as a pending skill.
// LOCAL ONLY: writes to data/skills.md so the next routine run enriches it.
// On a read-only env (e.g. Vercel) the write fails and we return a clear error
// the UI surfaces ("加 link 仅本地可用").

import { NextResponse } from "next/server";
import { addPendingSkill } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const link = (body?.link || "").trim();
    if (!link) return NextResponse.json({ ok: false, error: "请提供 GitHub link" }, { status: 400 });
    const row = addPendingSkill(link);
    return NextResponse.json({ ok: true, row });
  } catch (e: any) {
    const msg = e?.message || "写入失败";
    // EROFS / EACCES → read-only filesystem (serverless)
    const readOnly = /EROFS|EACCES|read-only/i.test(msg);
    return NextResponse.json(
      { ok: false, error: readOnly ? "加 link 仅在本地运行时可用（当前环境只读）。" : msg },
      { status: readOnly ? 200 : 400 }
    );
  }
}
