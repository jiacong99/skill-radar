// GET /api/github/search?q=... — search GitHub for skill repos. On-demand.

import { NextResponse } from "next/server";
import { searchRepos } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") || "";
  if (!q.trim()) return NextResponse.json({ ok: true, items: [] });
  const res = await searchRepos(q);
  return NextResponse.json(res);
}
