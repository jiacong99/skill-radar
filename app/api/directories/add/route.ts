// POST /api/directories/add { label, path } — add a custom skills dir. LOCAL ONLY.

import { NextResponse } from "next/server";
import { addCustomDir } from "@/lib/providers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const b = await req.json().catch(() => ({}));
    const path = (b?.path || "").trim();
    const label = (b?.label || "").trim();
    if (!path) return NextResponse.json({ ok: false, error: "path required" }, { status: 400 });
    const res = addCustomDir(label, path);
    return NextResponse.json(res, { status: res.ok ? 200 : 200 });
  } catch (e: any) {
    const msg = (e?.message || "add failed").toString();
    const readOnly = /EROFS|EACCES|read-only/i.test(msg);
    return NextResponse.json({ ok: false, error: readOnly ? "Read-only environment — can't save." : msg });
  }
}
