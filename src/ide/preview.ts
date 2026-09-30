const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function inline(s: string): string {
  const codes: string[] = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => { codes.push(`<code>${esc(c)}</code>`); return `\u0000${codes.length - 1}\u0000`; });
  s = esc(s)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g, '<img alt="$1" src="$2"/>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)[^)]*\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*|__(.+?)__/g, (_, a, b) => `<strong>${a ?? b}</strong>`)
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/(^|\s)(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank">$2</a>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[+i]);
}

export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r/g, '').split('\n');
  let html = '';
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      html += `<pre data-lang="${esc(lang)}"><code>${esc(buf.join('\n'))}</code></pre>`;
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)/);
    if (h) {
      const id = h[2].toLowerCase().replace(/[^\w]+/g, '-');
      html += `<h${h[1].length} id="${id}">${inline(h[2])}</h${h[1].length}>`;
      i++; continue;
    }
    if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(line)) { html += '<hr/>'; i++; continue; }
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      html += `<blockquote>${renderMarkdown(buf.join('\n'))}</blockquote>`;
      continue;
    }
    if (/^\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\|?[\s:-]+\|/.test(lines[i + 1])) {
      const cells = (l: string) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = cells(line);
      i += 2;
      let body = '';
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) {
        body += '<tr>' + cells(lines[i]).map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>';
        i++;
      }
      html += `<table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>`;
      continue;
    }
    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      let items = '';
      while (i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])) {
        let t = lines[i].replace(/^\s*([-*+]|\d+\.)\s+/, '');
        const task = t.match(/^\[( |x)\]\s+(.*)/i);
        if (task) t = `<input type="checkbox" disabled ${task[1] !== ' ' ? 'checked' : ''}/> ${inline(task[2])}`;
        else t = inline(t);
        items += `<li>${t}</li>`;
        i++;
      }
      html += ordered ? `<ol>${items}</ol>` : `<ul>${items}</ul>`;
      continue;
    }
    if (!line.trim()) { i++; continue; }
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#|```|>|\s*([-*+]|\d+\.)\s|\|)/.test(lines[i])) buf.push(lines[i++]);
    if (!buf.length) buf.push(lines[i++]);
    html += `<p>${inline(buf.join(' '))}</p>`;
  }
  return html;
}

export const MD_STYLE = `
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.65;padding:24px 32px;max-width:860px;margin:0 auto;color:#e6edf3;background:#0d1117}
h1,h2{border-bottom:1px solid #30363d;padding-bottom:.3em}
a{color:#58a6ff} code{background:#6e768166;padding:.15em .4em;border-radius:6px;font-family:'JetBrains Mono',monospace;font-size:85%}
pre{background:#161b22;padding:16px;border-radius:8px;overflow:auto} pre code{background:none;padding:0}
blockquote{border-left:4px solid #3b82f6;margin:0;padding:0 1em;color:#8b949e}
table{border-collapse:collapse} td,th{border:1px solid #30363d;padding:6px 13px} tr:nth-child(2n){background:#161b22}
img{max-width:100%} hr{border:0;border-top:1px solid #30363d}
`;

const CONSOLE_BRIDGE = `<script>(function(){const s=(t,a)=>{try{parent.postMessage({__ide:true,type:t,text:a.map(x=>typeof x==='object'?JSON.stringify(x):String(x)).join(' ')},'*')}catch(e){}};['log','info','warn','error'].forEach(k=>{const o=console[k];console[k]=(...a)=>{s(k,a);o.apply(console,a)}});window.addEventListener('error',e=>s('error',[e.message+' (line '+e.lineno+')']));})();<\/script>`;

function resolvePath(from: string, rel: string) {
  if (/^(https?:)?\/\//.test(rel) || rel.startsWith('data:')) return null;
  const base = from.includes('/') ? from.slice(0, from.lastIndexOf('/')) : '';
  const out: string[] = [];
  for (const s of ((rel.startsWith('/') ? '' : base + '/') + rel).split('/')) {
    if (!s || s === '.') continue;
    if (s === '..') out.pop(); else out.push(s);
  }
  return out.join('/');
}

export function buildHtmlPreview(path: string, files: Record<string, string>): string {
  let html = files[path] ?? '';
  html = html.replace(/<link([^>]*?)href=["']([^"']+)["']([^>]*)>/gi, (m, a, href, b) => {
    if (!/stylesheet/i.test(a + b)) return m;
    const p = resolvePath(path, href);
    return p && files[p] != null ? `<style data-src="${p}">\n${files[p]}\n</style>` : m;
  });
  html = html.replace(/<script([^>]*?)src=["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (m, a, src, b) => {
    const p = resolvePath(path, src);
    return p && files[p] != null ? `<script${a}${b} data-src="${p}">\n${files[p].replace(/<\/script>/g, '<\\/script>')}\n</script>` : m;
  });
  html = html.replace(/(<img[^>]*?src=["'])([^"']+\.svg)(["'])/gi, (m, a, src, b) => {
    const p = resolvePath(path, src);
    return p && files[p] != null ? a + 'data:image/svg+xml;utf8,' + encodeURIComponent(files[p]) + b : m;
  });
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head([^>]*)>/i, `<head$1>${CONSOLE_BRIDGE}`);
  return CONSOLE_BRIDGE + html;
}

export function buildPreview(path: string, files: Record<string, string>): string {
  const content = files[path] ?? '';
  const lower = path.toLowerCase();
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return buildHtmlPreview(path, files);
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return `<!doctype html><html><head><meta charset="utf-8"><style>${MD_STYLE}</style></head><body>${renderMarkdown(content)}</body></html>`;
  if (lower.endsWith('.svg')) return `<!doctype html><html><body style="margin:0;display:grid;place-items:center;min-height:100vh;background:repeating-conic-gradient(#2a2a2a 0% 25%,#1f1f1f 0% 50%) 50%/20px 20px">${content}</body></html>`;
  if (lower.endsWith('.css')) return `<!doctype html><html><head><style>${content}</style></head><body><h1>Heading 1</h1><h2>Heading 2</h2><p>Paragraph with <a href="#">a link</a> and <code>code</code>.</p><button>Button</button> <input placeholder="Input"/><ul><li>List item</li><li>List item</li></ul><div class="card">.card</div><div class="container">.container</div></body></html>`;
  if (lower.endsWith('.json')) {
    try { return `<pre style="color:#e6edf3;background:#0d1117;margin:0;padding:16px;min-height:100vh;font-family:monospace">${esc(JSON.stringify(JSON.parse(content), null, 2))}</pre>`; }
    catch (e: any) { return `<pre style="color:#f87171;padding:16px">${esc(e.message)}</pre>`; }
  }
  return `<pre style="padding:16px;font-family:monospace;white-space:pre-wrap">${esc(content)}</pre>`;
}

export const canPreview = (p: string) => /\.(html?|md|markdown|svg|css|json)$/i.test(p);
