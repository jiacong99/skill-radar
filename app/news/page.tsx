import { getNews } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function NewsPage() {
  const news = getNews();
  return (
    <>
      <h1>Dev AI 新闻</h1>
      <p className="sub">最新 AI / Dev 资讯。由云端 routine 维护（HN / 官方 blog / release notes）。</p>

      {news.length === 0 ? (
        <div className="empty">暂无数据 —— 请从 Claude routine 触发一次更新。</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>标题</th>
                <th className="nowrap">来源</th>
                <th className="nowrap">日期</th>
                <th>摘要</th>
              </tr>
            </thead>
            <tbody>
              {news.map((n, i) => (
                <tr key={n.url + i}>
                  <td>{n.url ? <a href={n.url} target="_blank" rel="noreferrer">{n.title}</a> : n.title}</td>
                  <td className="nowrap dim">{n.source || "—"}</td>
                  <td className="nowrap dim">{n.date || "—"}</td>
                  <td className="desc">{n.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
