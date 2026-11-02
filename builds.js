'use strict';
const store = require('./store');
const events = require('./events');
const { diagnose, RULES } = require('./diagnosis');
const sim = require('./simulator');

const SEV_ORDER = { low: 1, medium: 2, high: 3, critical: 4 };
const uid = (p) => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const hex = (n, rng = Math.random) => Array.from({ length: n }, () => Math.floor(rng() * 16).toString(16)).join('');

const PROJECTS = ['payments-api', 'web-storefront', 'mobile-app-android', 'data-pipeline'];
const AUTHORS = ['Mohammed Sajid', 'Raviraj Singh', 'Guru Charan', 'Aditya Patel'];
const MESSAGES = [
  'Fix null check in checkout handler', 'Add retry logic to payment gateway', 'Bump dependencies', 'Refactor auth middleware',
  'Update Dockerfile base image', 'Add unit tests for cart service', 'Improve request logging', 'Upgrade React to 18.2',
  'Optimize SQL queries for orders', 'Stabilise integration tests', 'Add rate limiter to public API', 'Update CI configuration',
  'Implement coupon validation', 'Handle expired sessions', 'Cleanup unused helpers', 'Add health-check endpoint'
];

function createBuild(input, opts = {}) {
  const db = store.db;
  const project = String(input.project || 'unknown').slice(0, 80);
  const number = (db.counters[project] = (db.counters[project] || 0) + 1);
  const status = ['success', 'failed', 'running'].includes(input.status) ? input.status : 'success';
  const b = {
    id: uid('b'),
    number, project,
    branch: String(input.branch || 'main').slice(0, 80),
    commit: String(input.commit || hex(7)).slice(0, 7),
    author: String(input.author || 'unknown').slice(0, 80),
    message: String(input.message || '(no message)').slice(0, 200),
    trigger: input.trigger || 'push',
    status,
    startedAt: Number(input.startedAt) || Date.now(),
    durationSec: Number(input.durationSec) || 0,
    stages: Array.isArray(input.stages) ? input.stages : [],
    log: String(input.log || '').slice(0, 2_000_000),
    diagnosis: null
  };
  if (status === 'failed') b.diagnosis = diagnose(b.log);

  db.builds.push(b);
  db.builds.sort((x, y) => y.startedAt - x.startedAt);
  if (opts.seed) maybeAlert(b, opts); else { maybeAlert(b, opts); store.save(); events.broadcast('build', summary(b)); }
  return b;
}

function previousBuild(b) {
  return store.db.builds.find(x => x.id !== b.id && x.project === b.project && x.branch === b.branch && x.startedAt < b.startedAt && x.status !== 'running');
}

function maybeAlert(b, opts = {}) {
  const s = store.db.settings;
  if (s.branchFilter === 'main' && !['main', 'master'].includes(b.branch)) return;
  let alert = null;
  if (b.status === 'failed' && s.notifyOnFailure) {
    const d = b.diagnosis || {};
    const sev = d.severity || 'medium';
    if (SEV_ORDER[sev] < SEV_ORDER[s.minSeverity]) return;
    alert = {
      id: uid('a'), type: 'failure', buildId: b.id, project: b.project, branch: b.branch, severity: sev,
      title: `${b.project} #${b.number} failed — ${d.title || 'Unknown failure'}`,
      message: `${b.author} pushed ${b.commit} to ${b.branch}. ${d.failedStep ? 'Failed at stage "' + d.failedStep + '". ' : ''}${d.cause || ''}`,
      createdAt: b.startedAt + (b.durationSec || 0) * 1000, acknowledged: false, channels: ['dashboard']
    };
  } else if (b.status === 'success' && s.notifyOnRecovery) {
    const prev = previousBuild(b);
    if (prev && prev.status === 'failed') {
      alert = {
        id: uid('a'), type: 'recovery', buildId: b.id, project: b.project, branch: b.branch, severity: 'info',
        title: `${b.project} #${b.number} recovered`,
        message: `Build is green again on ${b.branch} after failed build #${prev.number}.`,
        createdAt: b.startedAt + (b.durationSec || 0) * 1000, acknowledged: false, channels: ['dashboard']
      };
    }
  }
  if (!alert) return;
  if (opts.seed) {
    alert.acknowledged = Date.now() - alert.createdAt > 36 * 3600 * 1000;
    store.db.alerts.unshift(alert);
    return;
  }
  store.db.alerts.unshift(alert);
  if (store.db.alerts.length > 500) store.db.alerts.length = 500;
  events.broadcast('alert', alert);
  sendWebhook(alert);
}

async function sendWebhook(alert) {
  const url = store.db.settings.webhookUrl;
  if (!url) return { sent: false, reason: 'No webhook URL configured' };
  const text = `[CI ${alert.type === 'failure' ? 'FAILURE' : 'RECOVERY'}] ${alert.title}\n${alert.message}`;
  try {
    const r = await fetch(url, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, content: text, alert }), signal: AbortSignal.timeout(6000)
    });
    if (!alert.channels.includes('webhook')) alert.channels.push('webhook');
    alert.webhookStatus = r.status;
    store.save();
    return { sent: true, status: r.status };
  } catch (e) {
    alert.webhookError = e.message;
    store.save();
    return { sent: false, reason: e.message };
  }
}

function summary(b) {
  const { log, ...rest } = b;
  return { ...rest, diagnosis: b.diagnosis ? { ruleId: b.diagnosis.ruleId, title: b.diagnosis.title, category: b.diagnosis.category, severity: b.diagnosis.severity, confidence: b.diagnosis.confidence, failedStep: b.diagnosis.failedStep } : null, hasLog: !!log };
}

/** Create a simulated pipeline run (success or one of the failure scenarios). */
function simulate({ scenario, status, project, rng = Math.random, startedAt } = {}) {
  const failRuleId = status === 'success' ? null : (scenario && RULES.find(r => r.id === scenario) ? scenario : (status === 'failed' || rng() > 0.68 ? RULES[Math.floor(rng() * RULES.length)].id : null));
  const proj = project || PROJECTS[Math.floor(rng() * PROJECTS.length)];
  const commit = hex(7, rng);
  const message = MESSAGES[Math.floor(rng() * MESSAGES.length)];
  const r = rng();
  const branch = r < 0.6 ? 'main' : r < 0.8 ? 'develop' : 'feature/' + ['checkout-v2', 'login-fix', 'search-index', 'api-limits'][Math.floor(rng() * 4)];
  const author = AUTHORS[Math.floor(rng() * AUTHORS.length)];
  const t0 = startedAt || Date.now();
  const l = sim.buildLog({ project: proj, commit, message, startedAt: t0, failRuleId, rng });
  return { project: proj, branch, commit, author, message, trigger: rng() > 0.25 ? 'push' : 'pull_request', startedAt: t0, ...l };
}

function seed() {
  const rng = sim.mulberry32(82);
  const now = Date.now();
  const days = 14, count = 64;
  const span = days * 86400000;
  for (let i = 0; i < count; i++) {
    const t = now - span + Math.round((i + rng() * 0.8) * (span / count)) - 3600000;
    const late = i > count - 9;
    const pFail = late ? 0.5 : 0.3;
    const status = rng() < pFail ? 'failed' : 'success';
    const input = simulate({ status, rng, startedAt: Math.min(t, now - 120000) });
    createBuild(input, { seed: true });
  }
  store.save();
}

function stats(days = 14) {
  const db = store.db;
  const since = Date.now() - days * 86400000;
  const inRange = db.builds.filter(b => b.startedAt >= since && b.status !== 'running');
  const success = inRange.filter(b => b.status === 'success').length;
  const failed = inRange.filter(b => b.status === 'failed').length;
  const last24 = db.builds.filter(b => b.startedAt >= Date.now() - 86400000);
  const durations = inRange.filter(b => b.durationSec > 0).map(b => b.durationSec);

  // daily buckets
  const daily = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
    const start = d.getTime(), end = start + 86400000;
    const dayB = inRange.filter(b => b.startedAt >= start && b.startedAt < end);
    daily.push({ date: d.toISOString().slice(0, 10), success: dayB.filter(b => b.status === 'success').length, failed: dayB.filter(b => b.status === 'failed').length });
  }

  // top causes
  const causeMap = new Map();
  inRange.filter(b => b.status === 'failed' && b.diagnosis).forEach(b => {
    const k = b.diagnosis.ruleId;
    const c = causeMap.get(k) || { ruleId: k, title: b.diagnosis.title, category: b.diagnosis.category, severity: b.diagnosis.severity, count: 0 };
    c.count++; causeMap.set(k, c);
  });
  const topCauses = [...causeMap.values()].sort((a, b) => b.count - a.count).slice(0, 6);

  // MTTR: time from a failure until the next success on same project+branch
  const groups = new Map();
  [...inRange].sort((a, b) => a.startedAt - b.startedAt).forEach(b => {
    const k = b.project + '|' + b.branch; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(b);
  });
  const recov = [];
  for (const list of groups.values()) {
    let failStart = null;
    for (const b of list) {
      if (b.status === 'failed' && failStart === null) failStart = b.startedAt;
      else if (b.status === 'success' && failStart !== null) { recov.push(b.startedAt - failStart); failStart = null; }
    }
  }
  const mttrMin = recov.length ? Math.round(recov.reduce((a, b) => a + b, 0) / recov.length / 60000) : null;

  const openAlerts = db.alerts.filter(a => !a.acknowledged && a.type === 'failure').length;
  return {
    days, total: inRange.length, success, failed,
    successRate: inRange.length ? Math.round(success / inRange.length * 1000) / 10 : null,
    failed24h: last24.filter(b => b.status === 'failed').length, total24h: last24.length,
    avgDurationSec: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null,
    mttrMin, openAlerts, daily, topCauses
  };
}

function projects() {
  const db = store.db;
  const names = new Set([...PROJECTS, ...db.builds.map(b => b.project)]);
  return [...names].map(name => {
    const list = db.builds.filter(b => b.project === name && b.status !== 'running');
    if (!list.length) return null;
    const ok = list.filter(b => b.status === 'success').length;
    const lastFailed = list.find(b => b.status === 'failed');
    return {
      name, total: list.length, success: ok, failed: list.length - ok,
      successRate: Math.round(ok / list.length * 1000) / 10,
      last: summary(list[0]),
      lastFailure: lastFailed ? { id: lastFailed.id, number: lastFailed.number, title: lastFailed.diagnosis && lastFailed.diagnosis.title, startedAt: lastFailed.startedAt } : null,
      history: list.slice(0, 24).reverse().map(b => ({ id: b.id, number: b.number, status: b.status }))
    };
  }).filter(Boolean).sort((a, b) => a.successRate - b.successRate);
}

/** Map a GitHub / GitLab style webhook body to our own build shape (or accept our native shape). */
function fromWebhook(body) {
  if (body && body.workflow_run) {
    const w = body.workflow_run;
    const c = w.conclusion || w.status;
    return {
      project: (body.repository && body.repository.name) || w.name, branch: w.head_branch, commit: w.head_sha,
      author: (w.actor && w.actor.login) || (w.head_commit && w.head_commit.author && w.head_commit.author.name),
      message: w.head_commit && w.head_commit.message ? w.head_commit.message.split('\n')[0] : w.display_title,
      status: c === 'success' ? 'success' : (c === 'failure' || c === 'timed_out' || c === 'cancelled') ? 'failed' : 'running',
      trigger: w.event, log: body.log || ''
    };
  }
  if (body && body.object_kind === 'pipeline') {
    const a = body.object_attributes || {};
    return {
      project: body.project && body.project.name, branch: a.ref, commit: a.sha, author: body.user && body.user.name,
      message: body.commit && body.commit.message ? body.commit.message.split('\n')[0] : 'GitLab pipeline',
      status: a.status === 'success' ? 'success' : a.status === 'failed' ? 'failed' : 'running',
      durationSec: a.duration, log: body.log || ''
    };
  }
  return body || {};
}

module.exports = { createBuild, simulate, seed, stats, projects, summary, sendWebhook, fromWebhook, PROJECTS };
