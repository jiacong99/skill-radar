// Server component: reads installed skills (live scan) + the whitelist +
// searched entries, merges them into view rows, and hands them to the client.
import { getWhitelist, getSearched } from "@/lib/db";
import { listInstalledSkills, anyProviderDetected } from "@/lib/detect";
import { detectedProviders } from "@/lib/providers";
import { buildSkillViews } from "@/lib/rank";
import SkillsClient from "./SkillsClient";

export const dynamic = "force-dynamic"; // always re-scan disk + re-read files

export default function SkillsPage() {
  const views = buildSkillViews(listInstalledSkills(), getWhitelist(), getSearched());
  const providers = detectedProviders().map((p) => ({ id: p.id, label: p.label, skillsDir: p.skillsDir }));
  return <SkillsClient views={views} providers={providers} detected={anyProviderDetected()} />;
}
