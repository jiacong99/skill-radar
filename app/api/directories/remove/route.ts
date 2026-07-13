// POST /api/directories/remove { id } — drop a custom skills dir. LOCAL ONLY.
// Only removes the entry from local-dirs.md; never deletes the folder itself.

import { NextResponse } from "next/server";
import { removeCustomDir } from "@/lib/providers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const b = await req.json().catch(() => ({}));
    const id = (b?.id || "").trim();
    if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
    removeCustomDir(id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: (e?.message || "remove failed").toString().slice(0, 200) });
  }
}
