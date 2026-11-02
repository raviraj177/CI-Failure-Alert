/* CI Sentinel — front end (vanilla JS, no build step) */
'use strict';

// ---------- icons ----------
const ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>',
  layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
  menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
  alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
  refresh: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  branch: '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  play: '<polygon points="5 3 19 12 5 21 5 3"/>',
  activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  percent: '<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  hash: '<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>'
};
const icon = (n) => `<i data-icon="${n}"></i>`;
function hydrateIcons(root = document) {
  root.querySelectorAll('i[data-icon]:not([data-done])').forEach(el => {
    el.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[el.dataset.icon] || ''}</svg>`;
    el.dataset.done = '1';
  });
}

// ---------- helpers ----------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = (s) => s ? s[0].toUpperCase() + s.slice(1) : '';
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const inline = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');

async function api(path, opts = {}) {
  const init = { method: opts.method || 'GET', headers: { 'content-type': 'application/json' } };
  if (opts.body !== undefined) init.body = JSON.stringify(opts.body);
  const r = await fetch('/api' + path, init);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || r.statusText);
  return data;
}

function timeAgo(ts) {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 45) return 'just now';
  if (s < 3600) return Math.round(s / 60) + ' min ago';
  if (s < 86400) return Math.round(s / 3600) + ' h ago';
  const d = Math.round(s / 86400);
  return d + (d === 1 ? ' day ago' : ' days ago');
}
const fmtDate = (ts) => new Date(ts).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
function fmtDur(sec) {
  if (sec == null) return '—';
  if (sec < 60) return sec + 's';
  return Math.floor(sec / 60) + 'm ' + String(sec % 60).padStart(2, '0') + 's';
}
function fmtMin(min) {
  if (min == null) return '—';
  if (min < 60) return min + ' min';
  if (min < 1440) return Math.floor(min / 60) + 'h ' + (min % 60) + 'm';
  return Math.floor(min / 1440) + 'd ' + Math.round((min % 1440) / 60) + 'h';
}
const STATUS_LABEL = { success: 'Passed', failed: 'Failed', running: 'Running', skipped: 'Skipped' };
const statusBadge = (s) => `<span class="badge s-${s}">${STATUS_LABEL[s] || s}</span>`;
const sevBadge = (s) => `<span class="badge sev-${s}">${cap(s)}</span>`;
const initials = (n) => n.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

function toast({ title, desc = '', kind = '', href }) {
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.innerHTML = `<div><div class="t">${esc(title)}</div>${desc ? `<div class="d">${esc(desc)}</div>` : ''}</div><button class="x" aria-label="Dismiss">✕</button>`;
  el.addEventListener('click', (e) => { if (e.target.closest('.x')) return el.remove(); if (href) location.hash = href; el.remove(); });
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), 7000);
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); }
  catch (_) {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } finally { ta.remove(); }
  }
  toast({ title: 'Copied to clipboard', kind: 'ok' });
}
function downloadText(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
}

// ---------- shared components ----------
function diagnosisCard(d) {
  if (!d) return '';
  const cls = d.ruleId === 'no_failure' ? 'ok' : (d.ruleId === 'unknown' || d.ruleId === 'no_log') ? 'neutral' : '';
  const pct = Math.round((d.confidence || 0) * 100);
  return `<section class="card diag ${cls}" aria-label="Automatic diagnosis">
    <div class="diag-top">
      <div>
        <div class="diag-tags"><span class="badge sev-${d.severity}">${cap(d.severity)} severity</span><span class="chip">${esc(d.category)}</span>${d.failedStep ? `<span class="chip muted">Stage: ${esc(d.failedStep)}</span>` : ''}</div>
        <h2>${esc(d.title)}</h2>
      </div>
      <div class="conf"><div class="lbl">Diagnosis confidence</div><div class="val">${pct}%</div><div class="meter"><div style="width:${pct}%"></div></div></div>
    </div>
    <div class="diag-cols">
      <div>
        <h3>Likely root cause</h3><p>${inline(d.cause)}</p>
        ${d.evidence.length ? `<h3>Evidence from the log <span class="muted" style="text-transform:none;letter-spacing:0">(click to jump)</span></h3><div class="evid">${d.evidence.map(e => `<button type="button" data-jump="${e.line}"><span class="ln">L${e.line}</span><span class="tx">${esc(e.text)}</span></button>`).join('')}</div>` : ''}
        ${d.otherMatches && d.otherMatches.length ? `<h3>Other possible causes</h3><div class="others">${d.otherMatches.map(o => `<span class="chip muted" title="${Math.round(o.confidence * 100)}% match">${esc(o.title)}</span>`).join('')}</div>` : ''}
      </div>
      <div><h3>Suggested fixes</h3><ol class="fixes">${d.fixes.map(f => `<li><span>${inline(f)}</span></li>`).join('')}</ol></div>
    </div>
  </section>`;
}

let currentLog = null;
const ERR_RE = /\b(error|failed|failure|fatal|exception|traceback|panic)\b|✖|exit code [1-9]/i;
function mountLogViewer(host, log, evidenceLines = [], { title = 'Build log' } = {}) {
  const MAX = 4000;
  const all = String(log).split(/\r?\n/);
  const lines = all.slice(0, MAX);
  const evid = new Set(evidenceLines);
  const st = { q: '', errorsOnly: false };
  host.innerHTML = `<section class="card log-card">
    <div class="card-head" style="padding-bottom:12px"><h2>${esc(title)}</h2><span class="sub">${all.length.toLocaleString()} lines</span></div>
    <div class="log-tools">
      <input type="text" placeholder="Search in log…" aria-label="Search in log" data-q>
      <label class="muted" style="display:inline-flex;gap:6px;align-items:center;cursor:pointer"><input type="checkbox" data-errs> Errors only</label>
      <button class="btn btn-sm" data-first type="button">${icon('alert')}First error</button>
      <button class="btn btn-sm" data-copy type="button">${icon('copy')}Copy</button>
      <button class="btn btn-sm" data-dl type="button">${icon('download')}Download</button>
      <span class="count" data-count></span>
    </div>
    <div class="log" data-log tabindex="0" role="log" aria-label="Log output"></div>
  </section>`;
  hydrateIcons(host);
  const box = $('[data-log]', host);
  const kind = (ln, i) => evid.has(i + 1) ? 'evi' : /Stage:\s/.test(ln) ? 'stg' : /✔|SUCCESS/.test(ln) ? 'ok' : ERR_RE.test(ln) ? 'err' : '';
  function render() {
    const q = st.q.toLowerCase();
    let shown = 0, hits = 0, out = '';
    lines.forEach((ln, i) => {
      const k = kind(ln, i);
      if (st.errorsOnly && k !== 'err' && k !== 'evi') return;
      if (q && !ln.toLowerCase().includes(q)) return;
      shown++;
      let html = esc(ln) || ' ';
      if (q) { const re = new RegExp(escRe(esc(st.q)), 'gi'); html = html.replace(re, m => { hits++; return `<mark>${m}</mark>`; }); }
      out += `<div class="ll ${k}" data-ln="${i + 1}"><span class="no">${i + 1}</span><span class="tx">${html}</span></div>`;
    });
    if (all.length > MAX && !q && !st.errorsOnly) out += `<div class="ll"><span class="no"></span><span class="tx" style="color:var(--log-dim)">… ${all.length - MAX} more lines not shown (download the log to see everything)</span></div>`;
    box.innerHTML = out || '<div class="ll"><span class="no"></span><span class="tx" style="color:var(--log-dim)">No matching lines</span></div>';
    $('[data-count]', host).textContent = (q || st.errorsOnly) ? `${shown} lines${q ? ' · ' + hits + ' matches' : ''}` : '';
  }
  function jump(n) {
    if (st.q || st.errorsOnly) { st.q = ''; st.errorsOnly = false; $('[data-q]', host).value = ''; $('[data-errs]', host).checked = false; render(); }
    const el = box.querySelector(`[data-ln="${n}"]`);
    if (!el) return;
    host.scrollIntoView({ behavior: 'smooth', block: 'start' });
    box.scrollTo({ top: Math.max(0, el.offsetTop - box.clientHeight / 2 + 20), behavior: 'smooth' });
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
  }
  $('[data-q]', host).addEventListener('input', e => { st.q = e.target.value.trim(); render(); });
  $('[data-errs]', host).addEventListener('change', e => { st.errorsOnly = e.target.checked; render(); });
  $('[data-first]', host).addEventListener('click', () => {
    const idx = evidenceLines.length ? evidenceLines[0] : (lines.findIndex(l => ERR_RE.test(l)) + 1);
    if (idx > 0) jump(idx); else toast({ title: 'No error lines found' });
  });
  $('[data-copy]', host).addEventListener('click', () => copyText(log));
  $('[data-dl]', host).addEventListener('click', () => downloadText('build.log', log));
  render();
  currentLog = { jump };
}
document.addEventListener('click', (e) => {
  const j = e.target.closest('[data-jump]');
  if (j && currentLog) currentLog.jump(Number(j.dataset.jump));
});

// ---------- charts ----------
function trendChart(daily) {
  const W = 720, H = 290, L = 34, R = 8, T = 12, Bm = 30;
  const max = Math.max(4, ...daily.map(d => d.success + d.failed));
  const top = Math.ceil(max / 2) * 2;
  const bw = (W - L - R) / daily.length;
  const bar = Math.min(34, bw * .62);
  const y = v => T + (H - T - Bm) * (1 - v / top);
  let s = `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Builds per day, passed versus failed">`;
  [0, .5, 1].forEach(f => { const v = top * f; s += `<line class="grid-line" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${Math.round(v)}</text>`; });
  daily.forEach((d, i) => {
    const x = L + i * bw + (bw - bar) / 2;
    const hs = (H - T - Bm) * d.success / top, hf = (H - T - Bm) * d.failed / top;
    const dt = new Date(d.date + 'T00:00:00');
    const label = dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    s += `<g><title>${label}: ${d.success} passed, ${d.failed} failed</title>`;
    if (d.success) s += `<rect x="${x}" y="${y(0) - hs}" width="${bar}" height="${hs}" rx="3" fill="var(--ok-solid)"/>`;
    if (d.failed) s += `<rect x="${x}" y="${y(0) - hs - hf}" width="${bar}" height="${hf}" rx="3" fill="var(--bad-solid)"/>`;
    s += `</g>`;
    if (daily.length <= 8 || i % 2 === (daily.length - 1) % 2) s += `<text x="${x + bar / 2}" y="${H - 9}" text-anchor="middle">${label}</text>`;
  });
  return s + '</svg>';
}
function ring(pct) {
  const C = 2 * Math.PI * 26, col = pct >= 85 ? 'var(--ok-solid)' : pct >= 65 ? 'var(--warn-solid)' : 'var(--bad-solid)';
  return `<svg class="ring" viewBox="0 0 64 64" role="img" aria-label="${pct}% success rate"><circle cx="32" cy="32" r="26" fill="none" stroke="var(--skip-bg)" stroke-width="7"/><circle cx="32" cy="32" r="26" fill="none" stroke="${col}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C * pct / 100} ${C}" transform="rotate(-90 32 32)"/><text x="32" y="37" text-anchor="middle">${Math.round(pct)}%</text></svg>`;
}

// ---------- pages ----------
const view = $('#view');
const pages = {};
let token = 0;
const state = { filters: { status: 'all', project: 'all', q: '', page: 0 }, alertTab: 'open' };

pages.dashboard = async () => {
  const [st, failed, al, projects] = await Promise.all([api('/stats?days=14'), api('/builds?status=failed&limit=6'), api('/alerts?limit=6'), api('/projects')]);
  const rate = st.successRate;
  const maxCause = Math.max(1, ...st.topCauses.map(c => c.count));
  return `
  <div class="page-head"><div><h1>Dashboard</h1><p>Pipeline health for the last ${st.days} days — failures are diagnosed automatically.</p></div>
    <a class="btn" href="#/builds?status=failed">${icon('alert')}View all failures</a></div>
  <div class="grid grid-kpi">
    <div class="card kpi"><span class="ico ico-ok">${icon('percent')}</span><div class="label">Success rate</div><div class="value">${rate == null ? '—' : rate + '%'}</div><div class="note">${st.success} passed · ${st.failed} failed of ${st.total}</div></div>
    <div class="card kpi"><span class="ico ico-bad">${icon('alert')}</span><div class="label">Failures (24 h)</div><div class="value">${st.failed24h}</div><div class="note">${st.total24h} builds in the last 24 hours</div></div>
    <div class="card kpi"><span class="ico ico-warn">${icon('clock')}</span><div class="label">Mean time to recovery</div><div class="value">${fmtMin(st.mttrMin)}</div><div class="note">From first failure to next green build</div></div>
    <div class="card kpi"><span class="ico ico-info">${icon('activity')}</span><div class="label">Avg build duration</div><div class="value">${fmtDur(st.avgDurationSec)}</div><div class="note">${st.openAlerts} open failure alert${st.openAlerts === 1 ? '' : 's'}</div></div>
  </div>
  <div class="grid grid-2">
    <section class="card"><div class="card-head"><h2>Builds per day</h2><div class="legend"><span style="--c:var(--ok-solid)">Passed</span><span style="--c:var(--bad-solid)">Failed</span></div></div><div class="card-body">${trendChart(st.daily)}</div></section>
    <section class="card"><div class="card-head"><h2>Top failure causes</h2><span class="sub">${st.days} days</span></div><div class="card-body">
      ${st.topCauses.length ? `<div class="bars">${st.topCauses.map(c => `<div class="bar-row"><div class="top"><span>${esc(c.title)}</span><span class="muted">${c.count}</span></div><div class="bar-track"><div class="bar-fill" style="width:${c.count / maxCause * 100}%"></div></div></div>`).join('')}</div>` : '<div class="empty"><strong>No failures 🎉</strong>Nothing to diagnose in this period.</div>'}
    </div></section>
  </div>
  <div class="grid grid-2b">
    <section class="card"><div class="card-head" style="padding-bottom:12px"><h2>Latest failures</h2><a href="#/builds?status=failed" class="sub">See all</a></div>
      <div class="feed">${failed.items.length ? failed.items.map(b => `<div class="feed-item" data-href="#/builds/${b.id}"><span class="feed-ico s-failed">${icon('x')}</span><div class="feed-main"><div class="t">${esc(b.project)} #${b.number} — ${esc(b.diagnosis ? b.diagnosis.title : 'Failed')}</div><div class="d">${esc(b.branch)} · ${esc(b.author)} · ${timeAgo(b.startedAt)}</div></div>${b.diagnosis ? sevBadge(b.diagnosis.severity) : ''}</div>`).join('') : '<div class="empty"><strong>All clear</strong>No failed builds.</div>'}</div></section>
    <section class="card"><div class="card-head"><h2>Project health</h2><a href="#/projects" class="sub">Details</a></div><div class="card-body"><div class="bars">
      ${projects.map(p => { const col = p.successRate >= 85 ? 'var(--ok-solid)' : p.successRate >= 65 ? 'var(--warn-solid)' : 'var(--bad-solid)'; return `<div class="bar-row"><div class="top"><a href="#/builds?project=${encodeURIComponent(p.name)}">${esc(p.name)}</a><span class="muted">${p.successRate}% · ${p.total} builds</span></div><div class="bar-track"><div class="bar-fill" style="width:${p.successRate}%;background:${col}"></div></div></div>`; }).join('')}
    </div></div></section>
  </div>
  <section class="card"><div class="card-head" style="padding-bottom:12px"><h2>Recent alerts</h2><a href="#/alerts" class="sub">Open alert centre</a></div>
    <div class="feed">${al.items.length ? al.items.map(alertFeedItem).join('') : '<div class="empty"><strong>No alerts yet</strong></div>'}</div></section>`;
};
function alertFeedItem(a) {
  const ok = a.type === 'recovery';
  return `<div class="feed-item" data-href="${a.buildId ? '#/builds/' + a.buildId : '#/alerts'}"><span class="feed-ico ${ok ? 's-success' : 'sev-' + a.severity}">${icon(ok ? 'check' : 'alert')}</span><div class="feed-main"><div class="t">${esc(a.title)}</div><div class="d">${timeAgo(a.createdAt)}${a.acknowledged ? ' · acknowledged' : ''}</div></div></div>`;
}

pages.builds = async (parts, query) => {
  if (parts[1]) return pages.buildDetail(parts[1]);
  if (query.has('status')) state.filters.status = query.get('status');
  if (query.has('project')) state.filters.project = query.get('project');
  if (query.has('q')) state.filters.q = query.get('q');
  const projects = await api('/projects');
  const f = state.filters;
  setTimeout(() => bindBuilds(), 0);
  return `<div class="page-head"><div><h1>Builds</h1><p>Every pipeline run with its automatic diagnosis.</p></div></div>
  <section class="card"><div class="filters">
    <div class="seg" role="group" aria-label="Status filter">${['all', 'failed', 'success'].map(s => `<button type="button" data-status="${s}" class="${f.status === s ? 'on' : ''}">${s === 'all' ? 'All' : s === 'failed' ? 'Failed' : 'Passed'}</button>`).join('')}</div>
    <select id="fProject" aria-label="Project"><option value="all">All projects</option>${projects.map(p => `<option ${f.project === p.name ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>
    <input type="text" id="fQ" placeholder="Filter by text…" value="${esc(f.q)}" aria-label="Filter by text">
  </div><div id="buildsTable"></div></section>`;
};
async function bindBuilds() {
  const f = state.filters;
  const PAGE = 12;
  async function load() {
    const p = new URLSearchParams({ status: f.status, project: f.project, q: f.q, limit: PAGE, offset: f.page * PAGE });
    const r = await api('/builds?' + p);
    const host = $('#buildsTable'); if (!host) return;
    host.innerHTML = r.items.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>Status</th><th>Build</th><th>Branch</th><th>Author</th><th>Root cause</th><th>Duration</th><th>When</th></tr></thead><tbody>
      ${r.items.map(b => `<tr data-href="#/builds/${b.id}"><td>${statusBadge(b.status)}</td><td><div class="title">${esc(b.project)} <span class="muted">#${b.number}</span></div><div class="sub">${esc(b.message)}</div></td>
      <td class="nowrap">${esc(b.branch)}<div class="sub mono">${esc(b.commit)}</div></td><td class="nowrap">${esc(b.author)}</td>
      <td>${b.diagnosis ? `<span class="chip" title="${esc(b.diagnosis.title)}">${esc(b.diagnosis.title)}</span>` : '<span class="muted">—</span>'}</td>
      <td class="nowrap">${fmtDur(b.durationSec)}</td><td class="nowrap muted" title="${fmtDate(b.startedAt)}">${timeAgo(b.startedAt)}</td></tr>`).join('')}</tbody></table></div>
      <div class="pager"><span>Showing ${f.page * PAGE + 1}–${Math.min((f.page + 1) * PAGE, r.total)} of ${r.total}</span><span style="display:flex;gap:8px"><button class="btn btn-sm" id="prevP" ${f.page === 0 ? 'disabled' : ''}>Previous</button><button class="btn btn-sm" id="nextP" ${(f.page + 1) * PAGE >= r.total ? 'disabled' : ''}>Next</button></span></div>`
      : '<div class="empty"><strong>No builds match these filters</strong>Try clearing the search or use “Simulate build”.</div>';
    $('#prevP') && ($('#prevP').onclick = () => { f.page--; load(); });
    $('#nextP') && ($('#nextP').onclick = () => { f.page++; load(); });
  }
  $$('[data-status]').forEach(b => b.onclick = () => { f.status = b.dataset.status; f.page = 0; $$('[data-status]').forEach(x => x.classList.toggle('on', x === b)); load(); });
  $('#fProject').onchange = e => { f.project = e.target.value; f.page = 0; load(); };
  let t; $('#fQ').oninput = e => { clearTimeout(t); t = setTimeout(() => { f.q = e.target.value; f.page = 0; load(); }, 250); };
  load();
}

pages.buildDetail = async (id) => {
  const b = await api('/builds/' + id);
  const d = b.diagnosis;
  setTimeout(() => {
    const host = $('#logHost'); if (!host) return;
    if (b.log) mountLogViewer(host, b.log, d ? d.evidenceLines : []);
    else host.innerHTML = '<div class="card empty"><strong>No log was attached to this build</strong>Send the log in the webhook payload (field “log”) to get diagnosis.</div>';
    $('#btnRerun').onclick = async (e) => { e.target.disabled = true; try { const nb = await api(`/builds/${id}/rerun`, { method: 'POST' }); toast({ title: `Re-run created: #${nb.number} ${STATUS_LABEL[nb.status]}`, kind: nb.status === 'success' ? 'ok' : 'bad' }); location.hash = '#/builds/' + nb.id; } catch (err) { toast({ title: err.message, kind: 'bad' }); e.target.disabled = false; } };
    $('#btnDel').onclick = async () => { if (!confirm('Delete this build and its alerts?')) return; await api('/builds/' + id, { method: 'DELETE' }); location.hash = '#/builds'; };
  }, 0);
  return `<div class="crumbs"><a href="#/builds">Builds</a> / ${esc(b.project)} / #${b.number}</div>
  <section class="card build-head">
    <h1>${esc(b.project)} <span class="muted">#${b.number}</span> ${statusBadge(b.status)}</h1>
    <div class="msg">${esc(b.message)}</div>
    <div class="meta"><span>${icon('branch')}${esc(b.branch)}</span><span class="mono">${esc(b.commit)}</span><span>${icon('user')}${esc(b.author)}</span><span>${icon('clock')}${fmtDur(b.durationSec)}</span><span>${icon('play')}${esc(b.trigger)}</span><span>Started ${fmtDate(b.startedAt)}</span></div>
    <div class="head-actions"><button class="btn btn-primary" id="btnRerun">${icon('refresh')}Re-run build</button><button class="btn btn-danger" id="btnDel">${icon('trash')}Delete</button></div>
  </section>
  ${b.stages.length ? `<section class="card stages" aria-label="Pipeline stages" style="margin-bottom:18px">${b.stages.map(s => `<div class="stage ${s.status}"><div class="node">${icon(s.status === 'success' ? 'check' : s.status === 'failed' ? 'x' : 'minus')}</div><div class="n">${esc(s.name)}</div><div class="t">${s.status === 'skipped' ? 'skipped' : fmtDur(s.durationSec)}</div></div>`).join('')}</section>` : ''}
  ${b.status === 'failed' ? diagnosisCard(d) : `<section class="card diag ok" style="margin-bottom:18px"><div class="diag-top" style="padding-bottom:20px"><div><h2 style="margin-top:0">${b.status === 'success' ? 'This build passed — nothing to diagnose' : 'Build is running'}</h2></div></div></section>`}
  <div id="logHost"></div>`;
};

pages.analyzer = async () => {
  const samples = await api('/samples');
  setTimeout(() => {
    const ta = $('#logIn'), out = $('#analyzeOut');
    const run = async () => {
      if (!ta.value.trim()) { toast({ title: 'Paste a log first', kind: 'bad' }); return; }
      $('#btnAnalyze').disabled = true;
      try {
        const d = await api('/analyze', { method: 'POST', body: { log: ta.value } });
        out.innerHTML = diagnosisCard(d) + '<div id="anLog"></div>';
        hydrateIcons(out);
        mountLogViewer($('#anLog'), ta.value, d.evidenceLines, { title: 'Analysed log' });
        out.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (e) { toast({ title: e.message, kind: 'bad' }); }
      $('#btnAnalyze').disabled = false;
    };
    $('#btnAnalyze').onclick = run;
    ta.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run(); });
    $('#btnClear').onclick = () => { ta.value = ''; out.innerHTML = ''; currentLog = null; };
    $('#sampleSel').onchange = e => { const s = samples.find(x => x.id === e.target.value); if (s) { ta.value = s.log; out.innerHTML = ''; } };
    $('#fileIn').onchange = async e => { const file = e.target.files[0]; if (file) { ta.value = await file.text(); out.innerHTML = ''; } };
  }, 0);
  return `<div class="page-head"><div><h1>Log Analyzer</h1><p>Paste any CI log (GitHub Actions, GitLab, Jenkins, Maven, npm…) and get the root cause and fixes instantly.</p></div></div>
  <section class="card analyzer-in">
    <textarea id="logIn" placeholder="Paste your failing CI log here…" spellcheck="false" aria-label="CI log"></textarea>
    <div class="analyzer-bar">
      <button class="btn btn-primary" id="btnAnalyze">${icon('search')}Diagnose log</button>
      <button class="btn" id="btnClear">Clear</button>
      <select id="sampleSel" aria-label="Load sample"><option value="">Load a sample failure…</option>${samples.map(s => `<option value="${s.id}">${esc(s.title)}</option>`).join('')}</select>
      <label class="btn" style="cursor:pointer">${icon('download')}Open .log file<input type="file" id="fileIn" accept=".log,.txt,text/plain" hidden></label>
      <span class="muted hide-sm">Tip: Ctrl/⌘ + Enter</span>
    </div>
  </section><div id="analyzeOut" style="margin-top:18px"></div>`;
};

pages.alerts = async () => {
  const r = await api('/alerts?limit=200');
  const items = state.alertTab === 'open' ? r.items.filter(a => !a.acknowledged) : r.items;
  setTimeout(() => {
    $$('[data-tab]').forEach(b => b.onclick = () => { state.alertTab = b.dataset.tab; route(true); });
    $$('[data-ack]').forEach(b => b.onclick = async () => { await api(`/alerts/${b.dataset.ack}/ack`, { method: 'POST' }); });
    const all = $('#ackAll'); if (all) all.onclick = async () => { await api('/alerts/ack-all', { method: 'POST' }); toast({ title: 'All alerts acknowledged', kind: 'ok' }); };
  }, 0);
  return `<div class="page-head"><div><h1>Alert centre</h1><p>Failure and recovery notifications. ${r.open} open.</p></div>
    <div style="display:flex;gap:10px"><div class="seg"><button data-tab="open" class="${state.alertTab === 'open' ? 'on' : ''}">Open</button><button data-tab="all" class="${state.alertTab === 'all' ? 'on' : ''}">All</button></div>
    <button class="btn" id="ackAll" ${r.open ? '' : 'disabled'}>${icon('check')}Acknowledge all</button></div></div>
  <section class="card">${items.length ? items.map(a => {
    const ok = a.type === 'recovery';
    return `<div class="alert-card ${a.acknowledged ? 'acked' : ''}"><span class="feed-ico ${ok ? 's-success' : 'sev-' + a.severity}">${icon(ok ? 'check' : 'alert')}</span>
      <div class="body"><h3>${esc(a.title)}</h3><p>${esc(a.message)}</p>
      <div class="row">${ok ? '<span class="badge s-success">Recovered</span>' : sevBadge(a.severity)}<span>${timeAgo(a.createdAt)}</span><span>via ${a.channels.join(', ')}</span>${a.webhookError ? `<span style="color:var(--bad)">webhook error: ${esc(a.webhookError)}</span>` : ''}${a.buildId ? `<a href="#/builds/${a.buildId}">Open build →</a>` : ''}</div></div>
      ${a.acknowledged ? '<span class="muted nowrap">Acknowledged</span>' : `<button class="btn btn-sm" data-ack="${a.id}">${icon('check')}Acknowledge</button>`}</div>`;
  }).join('') : `<div class="empty"><strong>${state.alertTab === 'open' ? 'No open alerts 🎉' : 'No alerts yet'}</strong>New failures will appear here instantly.</div>`}</section>`;
};

pages.projects = async () => {
  const ps = await api('/projects');
  return `<div class="page-head"><div><h1>Projects</h1><p>Health of every repository sending builds. Each bar is one build (oldest → newest).</p></div></div>
  <div class="proj-grid">${ps.map(p => `<section class="card proj">
    <div class="proj-top">${ring(p.successRate)}<div><h3>${esc(p.name)}</h3><div class="muted">Last build ${timeAgo(p.last.startedAt)} · ${statusBadge(p.last.status)}</div></div></div>
    <div class="hist" aria-label="Build history">${p.history.map(h => `<a href="#/builds/${h.id}" class="${h.status}" title="#${h.number} ${STATUS_LABEL[h.status]}"></a>`).join('')}</div>
    <div class="proj-stats"><div><b>${p.total}</b>builds</div><div><b style="color:var(--ok)">${p.success}</b>passed</div><div><b style="color:var(--bad)">${p.failed}</b>failed</div></div>
    ${p.lastFailure ? `<div class="muted" style="font-size:13px">Last failure: <a href="#/builds/${p.lastFailure.id}">#${p.lastFailure.number} ${esc(p.lastFailure.title || '')}</a></div>` : ''}
    <a class="btn btn-sm" href="#/builds?project=${encodeURIComponent(p.name)}" style="align-self:flex-start">View builds</a></section>`).join('')}</div>`;
};

pages.settings = async () => {
  const [s, rules] = await Promise.all([api('/settings'), api('/rules')]);
  const origin = location.origin;
  setTimeout(() => {
    const read = () => ({ notifyOnFailure: $('#sFail').checked, notifyOnRecovery: $('#sRec').checked, branchFilter: $('#sBranch').value, minSeverity: $('#sSev').value, webhookUrl: $('#sHook').value });
    $('#btnSave').onclick = async () => { try { await api('/settings', { method: 'PUT', body: read() }); toast({ title: 'Settings saved', kind: 'ok' }); } catch (e) { toast({ title: e.message, kind: 'bad' }); } };
    $('#btnTest').onclick = async () => { try { await api('/settings', { method: 'PUT', body: read() }); const r = await api('/settings/test', { method: 'POST' }); toast({ title: 'Test alert sent', desc: r.webhook.sent ? 'Webhook delivered (HTTP ' + r.webhook.status + ')' : 'Dashboard only — ' + r.webhook.reason, kind: 'ok' }); } catch (e) { toast({ title: e.message, kind: 'bad' }); } };
    $('#btnSimFail').onclick = async () => { const b = await api('/simulate', { method: 'POST', body: { status: 'failed', scenario: $('#sScenario').value || undefined } }); toast({ title: `Simulated failure: ${b.project} #${b.number}`, kind: 'bad', href: '#/builds/' + b.id }); };
    $('#btnSimOk').onclick = async () => { const b = await api('/simulate', { method: 'POST', body: { status: 'success' } }); toast({ title: `Simulated pass: ${b.project} #${b.number}`, kind: 'ok', href: '#/builds/' + b.id }); };
    $('#btnReset').onclick = async () => { if (confirm('Delete all builds/alerts and regenerate the demo data?')) { await api('/reset', { method: 'POST' }); toast({ title: 'Demo data regenerated', kind: 'ok' }); } };
    $$('[data-copycode]').forEach(b => b.onclick = () => copyText($('#' + b.dataset.copycode).textContent));
  }, 0);
  const curl = `curl -X POST ${origin}/api/webhook \\
  -H "Content-Type: application/json" \\
  -d '{
    "project": "my-service",
    "branch": "main",
    "commit": "9fceb02",
    "author": "Aditya Patel",
    "message": "Update dependencies",
    "status": "failed",
    "durationSec": 142,
    "log": "npm ERR! code ERESOLVE\\nnpm ERR! ERESOLVE unable to resolve dependency tree"
  }'`;
  const gha = `# .github/workflows/ci.yml  (add as the last step of your job)
- name: Report result to CI Sentinel
  if: always()
  run: |
    curl -s -X POST $SENTINEL_URL/api/webhook \\
      -H "Content-Type: application/json" \\
      -d "{\\"project\\":\\"\${{ github.event.repository.name }}\\",\\"branch\\":\\"\${{ github.ref_name }}\\",\\"commit\\":\\"\${{ github.sha }}\\",\\"author\\":\\"\${{ github.actor }}\\",\\"status\\":\\"\${{ job.status == 'success' && 'success' || 'failed' }}\\"}"`;
  return `<div class="page-head"><div><h1>Settings &amp; Integration</h1><p>Control who gets alerted and connect your CI system.</p></div></div>
  <div class="grid grid-2b">
    <section class="card"><div class="card-head"><h2>Alert rules</h2></div><div class="form-grid">
      <div class="toggle-row"><div><b>Alert on failed builds</b><div class="d">Create an alert whenever a pipeline fails.</div></div><label class="switch"><input type="checkbox" id="sFail" ${s.notifyOnFailure ? 'checked' : ''} aria-label="Alert on failed builds"><span></span></label></div>
      <div class="toggle-row"><div><b>Alert on recovery</b><div class="d">Tell me when a broken branch turns green again.</div></div><label class="switch"><input type="checkbox" id="sRec" ${s.notifyOnRecovery ? 'checked' : ''} aria-label="Alert on recovery"><span></span></label></div>
      <label class="field">Branches to monitor<select id="sBranch"><option value="all" ${s.branchFilter === 'all' ? 'selected' : ''}>All branches</option><option value="main" ${s.branchFilter === 'main' ? 'selected' : ''}>Only main / master</option></select></label>
      <label class="field">Minimum severity<select id="sSev">${['low', 'medium', 'high', 'critical'].map(v => `<option value="${v}" ${s.minSeverity === v ? 'selected' : ''}>${cap(v)} and above</option>`).join('')}</select></label>
      <label class="field">Webhook URL <small>Optional — Slack / Discord / Teams incoming webhook. Receives a JSON POST on every alert.</small><input type="url" id="sHook" placeholder="https://hooks.slack.com/services/…" value="${esc(s.webhookUrl)}"></label>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary" id="btnSave">Save settings</button><button class="btn" id="btnTest">${icon('bell')}Send test alert</button></div>
    </div></section>
    <section class="card"><div class="card-head"><h2>Demo tools</h2></div><div class="form-grid">
      <p class="muted" style="margin:0">No CI server connected? Create realistic pipeline runs to try the whole flow: build → failure → diagnosis → live alert.</p>
      <label class="field">Failure scenario<select id="sScenario"><option value="">Random failure</option>${rules.map(r => `<option value="${r.id}">${esc(r.title)}</option>`).join('')}</select></label>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary" id="btnSimFail">${icon('zap')}Simulate failing build</button><button class="btn" id="btnSimOk">${icon('check')}Simulate passing build</button></div>
      <hr style="border:0;border-top:1px solid var(--border);width:100%;margin:2px 0">
      <div><b>Reset</b><div class="muted" style="margin:2px 0 10px;font-size:13px">Wipe everything and regenerate fresh demo data.</div><button class="btn btn-danger" id="btnReset">${icon('trash')}Reset log data</button></div>
    </div></section>
  </div>
  <section class="card" style="margin-bottom:18px"><div class="card-head"><h2>Connect your CI</h2><span class="sub">Any system that can send an HTTP request</span></div><div class="card-body">
    <p class="muted" style="margin-top:0">Send one JSON request when a pipeline finishes. Include the <code>log</code> field for automatic root-cause diagnosis. GitHub <code>workflow_run</code> and GitLab pipeline payloads are understood natively.</p>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b>Generic webhook (curl)</b><button class="btn btn-sm" data-copycode="codeCurl">${icon('copy')}Copy</button></div><pre class="code" id="codeCurl">${esc(curl)}</pre>
    <div style="display:flex;justify-content:space-between;align-items:center;margin:18px 0 8px"><b>GitHub Actions step</b><button class="btn btn-sm" data-copycode="codeGha">${icon('copy')}Copy</button></div><pre class="code" id="codeGha">${esc(gha)}</pre>
  </div></section>
  <section class="card"><div class="card-head"><h2>Diagnosis knowledge base</h2><span class="sub">${rules.length} failure patterns</span></div><div class="card-body"><div class="tags">${rules.map(r => `<span class="chip" title="${esc(r.category)} · ${r.severity}">${esc(r.title)}</span>`).join('')}</div></div></section>`;
};

pages.about = async () => {
  const team = [['24WU0104078', 'Mohammed Sajid'], ['24WU0101116', 'Raviraj Singh'], ['24WU0104084', 'Guru Charan'], ['24WU0101069', 'Aditya Patel']];
  return `<section class="hero"><span class="pill">Project 82</span><h1>CI Failure Alert and Diagnosis Tool</h1>
    <p>A web platform that watches your CI/CD pipelines, alerts the team the moment a build breaks, and explains <em>why</em> it failed — with evidence from the log and concrete steps to fix it.</p></section>
  <div class="grid grid-2b">
    <section class="card"><div class="card-head"><h2>Project team</h2></div><div class="card-body table-wrap"><table class="tbl" style="margin:-6px 0"><thead><tr><th>Roll no.</th><th>Name</th></tr></thead><tbody>
      ${team.map(([id, n]) => `<tr style="cursor:default"><td class="mono">${id}</td><td><span class="avatar">${initials(n)}</span>${esc(n)}</td></tr>`).join('')}</tbody></table></div></section>
    <section class="card"><div class="card-head"><h2>Technology</h2></div><div class="card-body">
      <div class="tags"><span class="chip">Node.js</span><span class="chip">Built-in HTTP server</span><span class="chip">REST API</span><span class="chip">Server-Sent Events</span><span class="chip">Vanilla JavaScript SPA</span><span class="chip">SVG charts</span><span class="chip">JSON file storage</span></div>
      <p class="muted" style="margin-bottom:0">No external dependencies — runs anywhere Node.js 18+ is installed, with <code>node server.js</code>.</p></div></section>
  </div>
  <section class="card" style="margin-bottom:18px"><div class="card-head"><h2>How it works</h2></div><div class="card-body"><div class="steps">
    <div class="step"><div class="num">1</div><h4>Ingest</h4><p>CI systems post build results (and logs) to the webhook API when a pipeline finishes.</p></div>
    <div class="step"><div class="num">2</div><h4>Diagnose</h4><p>A rule engine with 22 failure patterns scans the log, finds the failing stage, ranks causes and extracts evidence lines.</p></div>
    <div class="step"><div class="num">3</div><h4>Alert</h4><p>Failures and recoveries are pushed live to the dashboard and optionally to Slack/Discord/Teams via webhook.</p></div>
    <div class="step"><div class="num">4</div><h4>Learn</h4><p>Trends, top failure causes, MTTR and project health show where the pipeline needs attention.</p></div>
  </div></div></section>
  <section class="card"><div class="card-head"><h2>Feature summary</h2></div><div class="card-body"><div class="tags">
    ${['Live dashboard with KPIs', 'Automatic root-cause diagnosis', 'Confidence score & evidence lines', 'Suggested fixes', 'Searchable log viewer', 'Manual log analyzer', 'Alert centre with acknowledge', 'Recovery notifications', 'Severity & branch filters', 'Outbound webhook (Slack/Discord)', 'GitHub / GitLab payload support', 'Re-run builds', 'Dark mode', 'Responsive layout'].map(f => `<span class="chip muted">${f}</span>`).join('')}</div></div></section>`;
};

// ---------- router ----------
function parseHash() {
  const h = location.hash.slice(1) || '/';
  const [p, qs] = h.split('?');
  return { parts: p.split('/').filter(Boolean), query: new URLSearchParams(qs || '') };
}
const LIVE_PAGES = new Set(['dashboard', 'builds', 'alerts', 'projects']);
let routeSeq = 0;
async function route(silent = false) {
  const my = ++routeSeq;
  const { parts, query } = parseHash();
  const name = parts[0] || 'dashboard';
  $$('#nav a').forEach(a => a.classList.toggle('active', a.dataset.route === name));
  if (!pages[name]) { view.innerHTML = '<div class="empty"><strong>Page not found</strong><a href="#/">Back to dashboard</a></div>'; return; }
  if (!silent) { view.innerHTML = '<div class="grid grid-kpi"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>'; }
  currentLog = null;
  try {
    const html = await pages[name](parts, query);
    if (my !== routeSeq) return;
    const sy = silent ? window.scrollY : 0;
    view.innerHTML = html;
    hydrateIcons(view);
    if (!silent) { window.scrollTo(0, 0); document.title = 'CI Sentinel — ' + cap(name); } else window.scrollTo(0, sy);
  } catch (e) {
    if (my !== routeSeq) return;
    view.innerHTML = `<div class="card empty"><strong>Something went wrong</strong>${esc(e.message)}<div style="margin-top:12px"><button class="btn" onclick="route()">Try again</button></div></div>`;
  }
}
window.addEventListener('hashchange', () => { $('#sidebar').classList.remove('open'); $('#scrim').classList.remove('show'); route(); });
view.addEventListener('click', (e) => {
  const row = e.target.closest('[data-href]');
  if (row && !e.target.closest('a,button')) location.hash = row.dataset.href;
});

// ---------- live updates ----------
let refreshTimer;
function scheduleRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    const { parts } = parseHash();
    const name = parts[0] || 'dashboard';
    if (LIVE_PAGES.has(name) && !(name === 'builds' && parts[1])) route(true);
    refreshBadge();
  }, 350);
}
async function refreshBadge() {
  try {
    const r = await api('/alerts?state=open&limit=1');
    const txt = r.open > 99 ? '99+' : String(r.open);
    for (const id of ['bellBadge', 'navAlertBadge']) { const el = $('#' + id); el.hidden = !r.open; el.textContent = txt; }
  } catch (_) { /* ignore */ }
}
function connectEvents() {
  const es = new EventSource('/api/events');
  es.onopen = () => { $('#liveDot').classList.add('on'); $('#liveText').textContent = 'Live — connected'; };
  es.onerror = () => { $('#liveDot').classList.remove('on'); $('#liveText').textContent = 'Reconnecting…'; };
  es.addEventListener('alert', (e) => {
    const a = JSON.parse(e.data);
    toast({ title: a.title, desc: a.type === 'failure' ? (a.severity.toUpperCase() + ' severity — click for details') : a.message, kind: a.type === 'failure' ? 'bad' : 'ok', href: a.buildId ? '#/builds/' + a.buildId : '#/alerts' });
    scheduleRefresh();
  });
  es.addEventListener('build', scheduleRefresh);
  es.addEventListener('refresh', scheduleRefresh);
}

// ---------- chrome wiring ----------
$('#globalSearch').addEventListener('submit', (e) => {
  e.preventDefault();
  const v = $('#globalSearchInput').value.trim();
  state.filters = { status: 'all', project: 'all', q: v, page: 0 };
  location.hash = '#/builds' + (v ? '?q=' + encodeURIComponent(v) : '');
  if (parseHash().parts[0] === 'builds' && !parseHash().parts[1]) route();
});
$('#bellBtn').onclick = () => { location.hash = '#/alerts'; };
$('#simulateBtn').onclick = async (e) => {
  const btn = e.currentTarget; btn.disabled = true;
  try { const b = await api('/simulate', { method: 'POST', body: {} }); if (b.status === 'success') toast({ title: `${b.project} #${b.number} passed`, kind: 'ok', href: '#/builds/' + b.id }); }
  catch (err) { toast({ title: err.message, kind: 'bad' }); }
  btn.disabled = false;
};
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  const el = $('#themeIcon'); el.dataset.icon = t === 'dark' ? 'sun' : 'moon'; el.removeAttribute('data-done'); el.innerHTML = ''; hydrateIcons();
  try { localStorage.setItem('theme', t); } catch (_) { /* ignore */ }
}
$('#themeBtn').onclick = () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
$('#menuBtn').onclick = () => { $('#sidebar').classList.add('open'); $('#scrim').classList.add('show'); };
$('#scrim').onclick = () => { $('#sidebar').classList.remove('open'); $('#scrim').classList.remove('show'); };

hydrateIcons();
applyTheme(document.documentElement.dataset.theme || 'light');
connectEvents();
refreshBadge();
route();
