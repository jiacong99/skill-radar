// POST /api/skills/sync — ff-pull every installed git skill. LOCAL ONLY.

import { NextResponse } from "next/server";
import { syncInstalled } from "@/lib/exec";
import { anyProviderDetected } from "@/lib/detect";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!anyProviderDetected()) {
    return NextResponse.json({ ok: false, available: false, reason: "No skills directory detected — sync only works locally.", results: [] });
  }
  try {
    const results = await syncInstalled();
    return NextResponse.json({ ok: true, available: true, results });
  } catch (e: any) {
    return NextResponse.json({ ok: false, available: true, results: [], error: (e?.message || "sync failed").toString().slice(0, 200) }, { status: 200 });
  }
}
