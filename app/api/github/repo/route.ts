// GET /api/github/repo?full=owner/repo — fetch a repo's basic metadata.

import { NextResponse } from "next/server";
import { getRepo } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const full = new URL(req.url).searchParams.get("full") || "";
  if (!/^[^/]+\/[^/]+$/.test(full)) return NextResponse.json({ ok: false, error: "bad repo" }, { status: 400 });
  return NextResponse.json(await getRepo(full));
}
