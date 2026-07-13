// POST /api/searched/remove { github_path } — drop a searched entry. Private.

import { NextResponse } from "next/server";
import { removeSearched } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const b = await req.json().catch(() => ({}));
    const github_path = (b?.github_path || "").trim();
    if (!github_path) return NextResponse.json({ ok: false, error: "github_path required" }, { status: 400 });
    removeSearched(github_path);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: (e?.message || "remove failed").toString().slice(0, 200) });
  }
}
