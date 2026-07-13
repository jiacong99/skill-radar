// Server wrapper: supplies the client with what's already installed / whitelisted
// so search results can be badged. The search itself runs client-side on demand.
import { getWhitelist } from "@/lib/db";
import { listInstalledSkills } from "@/lib/detect";
import SearchClient from "./SearchClient";

export const dynamic = "force-dynamic";

function repoKey(p: string): string {
  let s = (p || "").trim().replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/\.git$/i, "").replace(/\/$/, "");
  const parts = s.split("/").filter(Boolean);
  return (parts.length >= 2 ? `${parts[0]}/${parts[1]}` : s).toLowerCase();
}

export default function SearchPage() {
  const installed = listInstalledSkills();
  const whitelist = getWhitelist();
  const installedKeys = Array.from(new Set([
    ...installed.map((s) => s.name.toLowerCase()),
    ...installed.map((s) => repoKey(s.github_path)).filter(Boolean),
  ]));
  const whitelistKeys = Array.from(new Set([
    ...whitelist.map((s) => s.name.toLowerCase()),
    ...whitelist.map((s) => repoKey(s.github_path)).filter(Boolean),
  ]));
  return <SearchClient installedKeys={installedKeys} whitelistKeys={whitelistKeys} />;
}
