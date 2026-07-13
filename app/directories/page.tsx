// Server component: lists every known skills directory (built-in + custom),
// whether it exists, and how many skills it holds.
import { allProviders, countSkills } from "@/lib/providers";
import DirectoriesClient from "./DirectoriesClient";

export const dynamic = "force-dynamic";

export default function DirectoriesPage() {
  const dirs = allProviders().map((p) => ({
    id: p.id, label: p.label, path: p.skillsDir,
    builtin: p.builtin, custom: p.custom, exists: p.exists,
    count: p.exists ? countSkills(p.skillsDir) : 0,
  }));
  return <DirectoriesClient dirs={dirs} />;
}
