// GET /api/github/readme?full=owner/repo — fetch a repo's README (raw markdown).

import { NextResponse } from "next/server";
import { getReadme } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const full = new URL(req.url).searchParams.get("full") || "";
  if (!/^[^/]+\/[^/]+$/.test(full)) return NextResponse.json({ ok: false, error: "bad repo" }, { status: 400 });
  return NextResponse.json(await getReadme(full));
}
