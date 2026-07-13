// Tiny, dependency-free Markdown → HTML for README previews. Escapes HTML first,
// then applies a safe subset (headings, code, lists, links, bold, inline code).
// Not a full CommonMark implementation — good enough to read a README.

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string): string {
  // links [text](url) — only http(s), rendered with rel/target
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, text, url) =>
    `<a href="${url}" target="_blank" rel="noreferrer noopener">${text}</a>`);
  // bold **x**
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // inline code `x`
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  return s;
}

export function renderMarkdown(md: string): string {
  const src = escapeHtml(md || "").replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let inCode = false;
  let listOpen = false;

  const closeList = () => { if (listOpen) { out.push("</ul>"); listOpen = false; } };

  for (const raw of src) {
    const line = raw;
    if (/^```/.test(line.trim())) {
      if (inCode) { out.push("</code></pre>"); inCode = false; }
      else { closeList(); out.push("<pre><code>"); inCode = true; }
      continue;
    }
    if (inCode) { out.push(line + "\n"); continue; }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { closeList(); const lvl = h[1].length; out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`); continue; }

    const li = line.match(/^\s*[-*+]\s+(.*)$/);
    if (li) { if (!listOpen) { out.push("<ul>"); listOpen = true; } out.push(`<li>${inline(li[1])}</li>`); continue; }

    if (line.trim() === "") { closeList(); continue; }

    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }
  if (inCode) out.push("</code></pre>");
  closeList();
  return out.join("\n");
}
