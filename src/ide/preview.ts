import { CDN } from './cdn';

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

const MD_EXT = /\.(md|markdown|mdown|mkd|mkdn|mdx|qmd|rmd|livemd)$/i;

/** Parse CSV/TSV (RFC 4180 quoting). */
export function parseDelimited(text: string, sep: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"' && cell === '') q = true;
    else if (c === sep) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function csvPreview(content: string, sep: string, name: string): string {
  const rows = parseDelimited(content, sep).filter((r) => r.length > 1 || r[0] !== '');
  const head = rows[0] ?? [];
  const body = rows.slice(1, 5001);
  const cols = Math.max(head.length, ...body.map((r) => r.length));
  const numeric = Array.from({ length: cols }, (_, c) => body.length > 0 && body.every((r) => r[c] == null || r[c] === '' || !isNaN(Number(r[c]))));
  const th = Array.from({ length: cols }, (_, c) => `<th data-c="${c}" class="${numeric[c] ? 'num' : ''}">${esc(head[c] ?? '')}<span class="s"></span></th>`).join('');
  const tr = body.map((r, i) => `<tr><td class="rn">${i + 1}</td>${Array.from({ length: cols }, (_, c) => `<td class="${numeric[c] ? 'num' : ''}">${esc(r[c] ?? '')}</td>`).join('')}</tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;font:13px/1.4 -apple-system,Segoe UI,sans-serif;color:#e6edf3;background:#0d1117}
.bar{position:sticky;top:0;z-index:2;display:flex;gap:12px;align-items:center;padding:8px 12px;background:#161b22;border-bottom:1px solid #30363d}
input{background:#0d1117;color:#e6edf3;border:1px solid #30363d;border-radius:4px;padding:4px 8px;width:240px}
table{border-collapse:collapse;min-width:100%} th,td{border:1px solid #30363d;padding:4px 10px;white-space:nowrap;max-width:420px;overflow:hidden;text-overflow:ellipsis}
th{position:sticky;top:41px;background:#1f2630;cursor:pointer;text-align:left;user-select:none} th:hover{background:#27303b}
tr:nth-child(2n) td{background:#11161d} td.num,th.num{text-align:right;font-variant-numeric:tabular-nums} td.rn{color:#7d8590;text-align:right;background:#161b22!important}
.meta{color:#7d8590} .s{color:#58a6ff;margin-left:4px}
</style></head><body><div class="bar"><b>${esc(name)}</b><span class="meta">${body.length}${rows.length - 1 > 5000 ? ' of ' + (rows.length - 1) : ''} rows · ${cols} columns</span><input id="f" placeholder="Filter rows…"></div>
<table><thead><tr><th class="rn">#</th>${th}</tr></thead><tbody id="b">${tr}</tbody></table>
<script>
const tb=document.getElementById('b');let sc=-1,dir=1;
document.querySelectorAll('th[data-c]').forEach(h=>h.onclick=()=>{const c=+h.dataset.c;dir=sc===c?-dir:1;sc=c;const num=h.classList.contains('num');
const rs=[...tb.rows];rs.sort((a,b)=>{const x=a.cells[c+1].textContent,y=b.cells[c+1].textContent;return (num?(+x)-(+y):x.localeCompare(y))*dir});rs.forEach(r=>tb.appendChild(r));
document.querySelectorAll('.s').forEach(s=>s.textContent='');h.querySelector('.s').textContent=dir>0?'▲':'▼'});
document.getElementById('f').oninput=e=>{const q=e.target.value.toLowerCase();[...tb.rows].forEach(r=>r.style.display=r.textContent.toLowerCase().includes(q)?'':'none')};
<\/script></body></html>`;
}

function mermaidPage(blocksHtml: string, dark: boolean, extraStyle = ''): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;padding:24px;background:${dark ? '#0d1117' : '#ffffff'};color:${dark ? '#e6edf3' : '#1f2328'};font-family:-apple-system,Segoe UI,sans-serif}.mermaid{display:flex;justify-content:center;margin:12px 0}.err{color:#f87171;white-space:pre-wrap;font-family:monospace}${extraStyle}</style>
<script src="${CDN.mermaid}"><\/script></head><body>${blocksHtml}
<script>
(async()=>{try{if(!window.mermaid)throw new Error('Mermaid could not be loaded (offline?)');mermaid.initialize({startOnLoad:false,theme:${dark ? "'dark'" : "'default'"},securityLevel:'strict'});
const nodes=[...document.querySelectorAll('.mermaid')];for(let i=0;i<nodes.length;i++){const n=nodes[i];const src=n.textContent;try{const {svg}=await mermaid.render('m'+i,src);n.innerHTML=svg}catch(e){n.innerHTML='<div class="err">Mermaid: '+String(e.message||e).replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))+'</div>'}}}catch(e){document.body.insertAdjacentHTML('beforeend','<div class="err">'+e.message+'</div>')}})();
<\/script></body></html>`;
}

function dotPage(src: string, dark: boolean): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;padding:24px;background:${dark ? '#0d1117' : '#fff'};display:flex;justify-content:center}svg{max-width:100%;height:auto;background:#fff;border-radius:8px;padding:8px}.err{color:#f87171;white-space:pre-wrap;font-family:monospace}</style>
<script src="${CDN.viz}"><\/script></head><body><script>
const src=${JSON.stringify(src).replace(/</g, '\\u003c')};
(async()=>{try{if(!window.Viz)throw new Error('viz.js could not be loaded (offline?)');const viz=await Viz.instance();document.body.appendChild(viz.renderSVGElement(src))}catch(e){document.body.innerHTML='<div class="err">Graphviz: '+String(e.message||e).replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))+'</div>'}})();
<\/script></body></html>`;
}

export function buildPreview(path: string, files: Record<string, string>, opts: { dark?: boolean } = {}): string {
  const content = files[path] ?? '';
  const lower = path.toLowerCase();
  const dark = opts.dark ?? true;
  if (/\.(html?|xhtml)$/.test(lower)) return buildHtmlPreview(path, files);
  if (MD_EXT.test(lower)) {
    const body = renderMarkdown(content);
    if (body.includes('data-lang="mermaid"')) {
      return mermaidPage(body.replace(/<pre data-lang="mermaid"><code>([\s\S]*?)<\/code><\/pre>/g, '<div class="mermaid">$1</div>'), dark, MD_STYLE.replace(/body\{[^}]*\}/, 'body{font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;line-height:1.65;padding:24px 32px;max-width:860px;margin:0 auto}'));
    }
    return `<!doctype html><html><head><meta charset="utf-8"><style>${MD_STYLE}</style></head><body>${body}</body></html>`;
  }
  if (/\.(mmd|mermaid)$/.test(lower)) return mermaidPage(`<div class="mermaid">${esc(content)}</div>`, dark);
  if (/\.(dot|gv)$/.test(lower)) return dotPage(content, dark);
  if (/\.csv$/.test(lower)) return csvPreview(content, ',', path.split('/').pop()!);
  if (/\.(tsv|tab)$/.test(lower)) return csvPreview(content, '\t', path.split('/').pop()!);
  if (lower.endsWith('.svg')) return `<!doctype html><html><body style="margin:0;display:grid;place-items:center;min-height:100vh;background:repeating-conic-gradient(#2a2a2a 0% 25%,#1f1f1f 0% 50%) 50%/20px 20px">${content}</body></html>`;
  if (lower.endsWith('.css')) return `<!doctype html><html><head><style>${content}</style></head><body><h1>Heading 1</h1><h2>Heading 2</h2><p>Paragraph with <a href="#">a link</a> and <code>code</code>.</p><button>Button</button> <input placeholder="Input"/><ul><li>List item</li><li>List item</li></ul><div class="card">.card</div><div class="container">.container</div></body></html>`;
  if (lower.endsWith('.json')) {
    try { return `<pre style="color:#e6edf3;background:#0d1117;margin:0;padding:16px;min-height:100vh;font-family:monospace">${esc(JSON.stringify(JSON.parse(content), null, 2))}</pre>`; }
    catch (e: any) { return `<pre style="color:#f87171;padding:16px">${esc(e.message)}</pre>`; }
  }
  return `<pre style="padding:16px;font-family:monospace;white-space:pre-wrap">${esc(content)}</pre>`;
}

export const canPreview = (p: string) => /\.(html?|xhtml|md|markdown|mdown|mkd|mkdn|mdx|qmd|rmd|livemd|svg|css|json|mmd|mermaid|dot|gv|csv|tsv|tab)$/i.test(p);
