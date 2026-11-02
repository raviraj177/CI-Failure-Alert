'use strict';
/**
 * CI Failure Alert and Diagnosis Tool — Project 82
 * Zero-dependency Node.js server (http + fs only).  Run:  node server.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const store = require('./lib/store');
const events = require('./lib/events');
const B = require('./lib/builds');
const { diagnose, RULES } = require('./lib/diagnosis');
const sim = require('./lib/simulator');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC = path.join(__dirname, 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon'
};

store.load();
if (!store.db.builds.length) { B.seed(); console.log('Seeded demo data.'); }

// ---------- helpers ----------
function send(res, code, data) {
  const body = JSON.stringify(data);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}
function readBody(req, limit = 6 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(Object.assign(new Error('Payload too large'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch (_) { reject(Object.assign(new Error('Invalid JSON body'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}
const notFound = (res, what = 'Not found') => send(res, 404, { error: what });

// ---------- API routes ----------
async function api(req, res, url) {
  const p = url.pathname.replace(/^\/api/, '') || '/';
  const m = req.method;
  const q = url.searchParams;
  const db = store.db;
  let mt;

  if (p === '/events' && m === 'GET') return events.addClient(req, res);
  if (p === '/health') return send(res, 200, { ok: true, uptimeSec: Math.round(process.uptime()), builds: db.builds.length });

  // ----- builds -----
  if (p === '/builds' && m === 'GET') {
    let list = db.builds;
    const status = q.get('status'), project = q.get('project'), text = (q.get('q') || '').toLowerCase().trim();
    if (status && status !== 'all') list = list.filter(b => b.status === status);
    if (project && project !== 'all') list = list.filter(b => b.project === project);
    if (text) list = list.filter(b => [b.project, b.branch, b.commit, b.author, b.message, b.diagnosis && b.diagnosis.title, b.diagnosis && b.diagnosis.category].join(' ').toLowerCase().includes(text));
    const limit = Math.min(Number(q.get('limit')) || 20, 200), offset = Number(q.get('offset')) || 0;
    return send(res, 200, { total: list.length, items: list.slice(offset, offset + limit).map(B.summary) });
  }
  if (p === '/builds' && m === 'POST') {
    const body = await readBody(req);
    if (!body.project) return send(res, 400, { error: 'Field "project" is required' });
    return send(res, 201, B.summary(B.createBuild(body)));
  }
  if (p === '/webhook' && m === 'POST') {
    const body = B.fromWebhook(await readBody(req));
    if (!body.project) return send(res, 400, { error: 'Could not find a project name in the payload' });
    return send(res, 201, B.summary(B.createBuild(body)));
  }
  if ((mt = p.match(/^\/builds\/([\w-]+)$/))) {
    const b = db.builds.find(x => x.id === mt[1]);
    if (!b) return notFound(res, 'Build not found');
    if (m === 'GET') return send(res, 200, b);
    if (m === 'DELETE') {
      db.builds = db.builds.filter(x => x.id !== b.id);
      db.alerts = db.alerts.filter(a => a.buildId !== b.id);
      store.save(); events.broadcast('refresh', {});
      return send(res, 200, { ok: true });
    }
  }
  if ((mt = p.match(/^\/builds\/([\w-]+)\/rerun$/)) && m === 'POST') {
    const b = db.builds.find(x => x.id === mt[1]);
    if (!b) return notFound(res, 'Build not found');
    // transient problems usually pass on retry; real bugs usually fail again
    const transient = b.diagnosis && ['net_flaky', 'docker_pull', 'timeout', 'port_in_use'].includes(b.diagnosis.ruleId);
    const passes = Math.random() < (transient ? 0.85 : 0.2);
    const t0 = Date.now();
    const l = sim.buildLog({ project: b.project, commit: b.commit, message: b.message, startedAt: t0, failRuleId: passes ? null : (b.diagnosis && b.diagnosis.ruleId) || null });
    const nb = B.createBuild({ project: b.project, branch: b.branch, commit: b.commit, author: b.author, message: b.message, trigger: 'rerun', startedAt: t0, ...l });
    return send(res, 201, B.summary(nb));
  }

  // ----- diagnosis -----
  if (p === '/analyze' && m === 'POST') {
    const body = await readBody(req);
    if (!body.log || !String(body.log).trim()) return send(res, 400, { error: 'Provide a "log" string' });
    return send(res, 200, diagnose(body.log));
  }
  if (p === '/samples' && m === 'GET') return send(res, 200, sim.sampleLogs());
  if (p === '/rules' && m === 'GET') return send(res, 200, RULES.map(r => ({ id: r.id, title: r.title, category: r.category, severity: r.severity })));

  // ----- simulate / reset -----
  if (p === '/simulate' && m === 'POST') {
    const body = await readBody(req);
    const input = B.simulate({ scenario: body.scenario, status: body.status, project: body.project });
    return send(res, 201, B.summary(B.createBuild(input)));
  }
  if (p === '/reset' && m === 'POST') {
    store.reset(); B.seed(); events.broadcast('refresh', {});
    return send(res, 200, { ok: true });
  }

  // ----- stats / projects -----
  if (p === '/stats' && m === 'GET') return send(res, 200, B.stats(Math.min(Number(q.get('days')) || 14, 90)));
  if (p === '/projects' && m === 'GET') return send(res, 200, B.projects());

  // ----- alerts -----
  if (p === '/alerts' && m === 'GET') {
    let list = db.alerts;
    if (q.get('state') === 'open') list = list.filter(a => !a.acknowledged);
    const limit = Math.min(Number(q.get('limit')) || 50, 200);
    return send(res, 200, { total: list.length, open: db.alerts.filter(a => !a.acknowledged).length, items: list.slice(0, limit) });
  }
  if (p === '/alerts/ack-all' && m === 'POST') {
    db.alerts.forEach(a => { a.acknowledged = true; }); store.save(); events.broadcast('refresh', {});
    return send(res, 200, { ok: true });
  }
  if ((mt = p.match(/^\/alerts\/([\w-]+)\/ack$/)) && m === 'POST') {
    const a = db.alerts.find(x => x.id === mt[1]);
    if (!a) return notFound(res, 'Alert not found');
    a.acknowledged = true; store.save(); events.broadcast('refresh', {});
    return send(res, 200, a);
  }

  // ----- settings -----
  if (p === '/settings' && m === 'GET') return send(res, 200, db.settings);
  if (p === '/settings' && m === 'PUT') {
    const b = await readBody(req), s = db.settings;
    if (typeof b.notifyOnFailure === 'boolean') s.notifyOnFailure = b.notifyOnFailure;
    if (typeof b.notifyOnRecovery === 'boolean') s.notifyOnRecovery = b.notifyOnRecovery;
    if (['all', 'main'].includes(b.branchFilter)) s.branchFilter = b.branchFilter;
    if (['low', 'medium', 'high', 'critical'].includes(b.minSeverity)) s.minSeverity = b.minSeverity;
    if (typeof b.webhookUrl === 'string') {
      const u = b.webhookUrl.trim();
      if (u && !/^https?:\/\//i.test(u)) return send(res, 400, { error: 'Webhook URL must start with http:// or https://' });
      s.webhookUrl = u;
    }
    store.save();
    return send(res, 200, s);
  }
  if (p === '/settings/test' && m === 'POST') {
    const alert = {
      id: 'a_test_' + Date.now().toString(36), type: 'failure', buildId: null, project: 'test-alert', branch: 'main', severity: 'high',
      title: 'Test alert from CI Failure Alert & Diagnosis Tool', message: 'If you can read this, your alert channel works.',
      createdAt: Date.now(), acknowledged: false, channels: ['dashboard']
    };
    db.alerts.unshift(alert); store.save(); events.broadcast('alert', alert);
    const result = await B.sendWebhook(alert);
    return send(res, 200, { alert, webhook: result });
  }

  return notFound(res, 'Unknown API route');
}

// ---------- static files ----------
function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) {
      // SPA fallback
      return fs.readFile(path.join(PUBLIC, 'index.html'), (e2, d2) => {
        if (e2) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, { 'Content-Type': MIME['.html'] }); res.end(d2);
      });
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    return serveStatic(req, res, url);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) send(res, e.status || 500, { error: e.message || 'Server error' });
  }
});

server.listen(PORT, () => {
  console.log('\n  CI Failure Alert & Diagnosis Tool  —  Project 82');
  console.log(`  Running at  http://localhost:${PORT}\n`);
});

for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { store.saveNow(); process.exit(0); });
