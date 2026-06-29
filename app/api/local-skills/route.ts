// GET /api/local-skills — scan the local machine for installed skills.
// LOCAL ONLY: on a server without ~/.claude it returns { available:false } and
// the UI shows "仅本地可用" instead of crashing.

import { NextResponse } from "next/server";
import { getSkills } from "@/lib/db";
import { claudeAvailable, detectLocalSkills } from "@/lib/detect";

export const dynamic = "force-dynamic"; // never cache; reflects current machine

export async function GET() {
  try {
    if (!claudeAvailable()) {
      return NextResponse.json({
        available: false,
        reason: "本机没有 ~/.claude，已装检测仅在本地运行时可用。",
        local: {},
      });
    }
    const skills = getSkills();
    const local = detectLocalSkills(skills);
    return NextResponse.json({ available: true, local });
  } catch (e: any) {
    return NextResponse.json(
      { available: false, reason: e?.message || "检测失败", local: {} },
      { status: 200 } // soft-fail: UI handles it, no crash
    );
  }
}
