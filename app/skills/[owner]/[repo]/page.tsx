// Server component: a skill's detail = GitHub repo meta + rendered README, with
// client actions (install / save-as-searched).
import Link from "next/link";
import { getRepo, getReadme } from "@/lib/github";
import { renderMarkdown } from "@/lib/md";
import { detectedProviders } from "@/lib/providers";
import DetailActions from "./DetailActions";

export const dynamic = "force-dynamic";

export default async function DetailPage({ params }: { params: { owner: string; repo: string } }) {
  const full = `${params.owner}/${params.repo}`;
  const [meta, readme] = await Promise.all([getRepo(full), getReadme(full)]);
  const providers = detectedProviders().map((p) => ({ id: p.id, label: p.label, skillsDir: p.skillsDir }));

  const rateLimited = meta.rateLimited || readme.rateLimited;
  const repo = meta.repo;
  const html = readme.ok && readme.markdown ? renderMarkdown(readme.markdown) : "";

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{repo?.name || params.repo}</h1>
          <p className="sub"><Link href="/skills/search">← Search</Link> · <a href={`https://github.com/${full}`} target="_blank" rel="noreferrer">{full}</a>
            {repo && <> · ★ {repo.stars.toLocaleString()}</>}</p>
        </div>
      </div>

      {rateLimited && <div className="notice">GitHub rate limit hit. Wait a minute, or set GITHUB_TOKEN in your environment.</div>}
      {repo?.description && <p className="detail-desc">{repo.description}</p>}

      <DetailActions
        full={full}
        name={repo?.name || params.repo}
        description={repo?.description || ""}
        stars={repo?.stars || 0}
        providers={providers}
      />

      <div className="readme">
        {html
          ? <div className="readme-body" dangerouslySetInnerHTML={{ __html: html }} />
          : <div className="empty">No README found for this repository.</div>}
      </div>
    </>
  );
}
