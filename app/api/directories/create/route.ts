// POST /api/directories/create { path } — mkdir -p a skills dir. LOCAL ONLY.

import { NextResponse } from "next/server";
import { createDir } from "@/lib/providers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const b = await req.json().catch(() => ({}));
    const path = (b?.path || "").trim();
    if (!path) return NextResponse.json({ ok: false, error: "path required" }, { status: 400 });
    return NextResponse.json(createDir(path));
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: (e?.message || "mkdir failed").toString().slice(0, 200) });
  }
}
