// GitHub client — SERVER ONLY, on-demand. Unauthenticated works (low rate limit);
// an optional GITHUB_TOKEN in the environment raises it. The token is read from
// env only and is NEVER written to any file in the repo.

const API = "https://api.github.com";

// Query strategy: bias results toward agent-skill repos. Tunable in one place.
const QUERY_SUFFIX = "claude skill";

export interface GitHubRepo {
  name: string;
  full_name: string; // owner/repo
  description: string;
  stars: number;
  updated_at: string;
  html_url: string;
}

export interface SearchResult {
  ok: boolean;
  rateLimited?: boolean;
  error?: string;
  items: GitHubRepo[];
}

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "skill-radar",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function isRateLimited(res: Response): boolean {
  return (res.status === 403 || res.status === 429) && res.headers.get("x-ratelimit-remaining") === "0";
}

export async function searchRepos(q: string): Promise<SearchResult> {
  const query = `${q.trim()} ${QUERY_SUFFIX}`.trim();
  const url = `${API}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=30`;
  try {
    const res = await fetch(url, { headers: headers(), cache: "no-store" });
    if (isRateLimited(res)) return { ok: false, rateLimited: true, items: [] };
    if (!res.ok) return { ok: false, error: `GitHub ${res.status}`, items: [] };
    const data = await res.json();
    const items: GitHubRepo[] = (data.items || []).map((r: any) => ({
      name: r.name,
      full_name: r.full_name,
      description: r.description || "",
      stars: r.stargazers_count || 0,
      updated_at: r.updated_at || "",
      html_url: r.html_url || "",
    }));
    return { ok: true, items };
  } catch (e: any) {
    return { ok: false, error: (e?.message || "network error").toString().slice(0, 200), items: [] };
  }
}

export async function getRepo(fullName: string): Promise<{ ok: boolean; rateLimited?: boolean; repo?: GitHubRepo; error?: string }> {
  try {
    const res = await fetch(`${API}/repos/${fullName}`, { headers: headers(), cache: "no-store" });
    if (isRateLimited(res)) return { ok: false, rateLimited: true };
    if (!res.ok) return { ok: false, error: `GitHub ${res.status}` };
    const r = await res.json();
    return {
      ok: true,
      repo: {
        name: r.name, full_name: r.full_name, description: r.description || "",
        stars: r.stargazers_count || 0, updated_at: r.updated_at || "", html_url: r.html_url || "",
      },
    };
  } catch (e: any) {
    return { ok: false, error: (e?.message || "network error").toString().slice(0, 200) };
  }
}

export async function getReadme(fullName: string): Promise<{ ok: boolean; rateLimited?: boolean; markdown?: string; error?: string }> {
  try {
    const res = await fetch(`${API}/repos/${fullName}/readme`, {
      headers: { ...headers(), Accept: "application/vnd.github.raw" },
      cache: "no-store",
    });
    if (isRateLimited(res)) return { ok: false, rateLimited: true };
    if (res.status === 404) return { ok: true, markdown: "" }; // no README is not an error
    if (!res.ok) return { ok: false, error: `GitHub ${res.status}` };
    const markdown = await res.text();
    return { ok: true, markdown };
  } catch (e: any) {
    return { ok: false, error: (e?.message || "network error").toString().slice(0, 200) };
  }
}
