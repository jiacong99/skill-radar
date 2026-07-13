// POST /api/skills/install { name, github_path, providerId }
// Clone/upgrade one skill into the chosen provider's skills dir. LOCAL ONLY.

import { NextResponse } from "next/server";
import { installOrUpgrade } from "@/lib/exec";
import { findProvider, detectedProviders } from "@/lib/providers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const b = await req.json().catch(() => ({}));
    const name = (b?.name || "").trim();
    const github_path = (b?.github_path || "").trim();
    const providerId = (b?.providerId || "").trim();

    const provider = providerId ? findProvider(providerId) : detectedProviders()[0];
    if (!provider) {
      return NextResponse.json({ ok: false, error: "No skills directory available. Add one on the Directories page." }, { status: 200 });
    }
    const result = await installOrUpgrade(name, github_path, provider.skillsDir);
    return NextResponse.json({ ok: result.ok, result, provider: provider.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: (e?.message || "install failed").toString().slice(0, 200) }, { status: 200 });
  }
}
