// POST /api/searched/save { name, github_path, description, stars, remark }
// Record a GitHub result you looked at but didn't install. Private (gitignored).

import { NextResponse } from "next/server";
import { saveSearched } from "@/lib/db";

export const dynamic = "force-dynamic";

// Server-side date stamp (the db module stays Date-free for testability).
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  try {
    const b = await req.json().catch(() => ({}));
    const github_path = (b?.github_path || "").trim();
    if (!github_path) return NextResponse.json({ ok: false, error: "github_path required" }, { status: 400 });
    saveSearched({
      name: (b?.name || "").trim(),
      github_path,
      description: (b?.description || "").trim(),
      stars: Number(b?.stars) || 0,
      remark: (b?.remark || "").trim(),
      saved_at: today(),
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = (e?.message || "save failed").toString();
    const readOnly = /EROFS|EACCES|read-only/i.test(msg);
    return NextResponse.json({ ok: false, error: readOnly ? "Read-only environment — can't save." : msg });
  }
}
