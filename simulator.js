'use strict';
// Generates realistic pipeline logs (used for demo data, the "Simulate build" button and analyzer samples).
const { RULES } = require('./diagnosis');

const STAGES = ['Checkout', 'Install', 'Lint', 'Build', 'Test', 'Package', 'Deploy'];

const FILLER = {
  Checkout: ['Syncing repository: acme/{project}', 'Fetching the repository', 'HEAD is now at {commit} {message}'],
  Install: ['npm ci --prefer-offline', 'added 1284 packages in 21s', '212 packages are looking for funding', 'Restored cache: node-modules-v4'],
  Lint: ['> eslint src --max-warnings=0', 'Checked 143 files', 'No lint problems found'],
  Build: ['> {project}@2.4.0 build', 'Compiled successfully in 38.2s', 'Creating an optimized production build...', 'Build output: 4.1 MB (gzip 1.2 MB)'],
  Test: ['> jest --coverage --runInBand', ' PASS  src/utils/format.test.js', ' PASS  src/cart/cart.test.js', ' PASS  src/auth/session.test.js', 'Test Suites: 7 passed, 7 total', 'Tests:       48 passed, 48 total', 'Coverage: 86.4% statements'],
  Package: ['docker build -t acme/{project}:{commit} .', 'Successfully built 7f3a91c2d0b4', 'Pushed acme/{project}:{commit}'],
  Deploy: ['kubectl apply -f k8s/', 'deployment.apps/{project} configured', 'deployment "{project}" successfully rolled out']
};

const hhmmss = t => new Date(t).toISOString().slice(11, 19);
const sub = (s, v) => s.replace(/\{project\}/g, v.project).replace(/\{commit\}/g, v.commit).replace(/\{message\}/g, v.message || '');

function randInt(rng, a, b) { return Math.floor(rng() * (b - a + 1)) + a; }

/**
 * Build a log for a pipeline run.
 * failRuleId: id of the diagnosis rule to simulate, or null for a successful run.
 */
function buildLog({ project, commit, message, startedAt, failRuleId, rng = Math.random }) {
  const rule = failRuleId ? RULES.find(r => r.id === failRuleId) : null;
  const failStage = rule ? rule.sample.stage : null;
  const failIdx = failStage ? STAGES.indexOf(failStage) : -1;
  const v = { project, commit, message };
  const out = [];
  const stages = [];
  let t = startedAt;
  const push = (line) => out.push(`${hhmmss(t)}  ${line}`);

  push(`Pipeline #${commit} started for ${project}`);
  push(`Runner: ubuntu-22.04 | Node v20.11.1 | 4 vCPU / 8 GB`);

  for (let i = 0; i < STAGES.length; i++) {
    const name = STAGES[i];
    if (failIdx >= 0 && i > failIdx) { stages.push({ name, status: 'skipped', durationSec: 0 }); continue; }
    const base = { Checkout: 6, Install: 28, Lint: 14, Build: 52, Test: 75, Package: 40, Deploy: 33 }[name];
    const dur = Math.max(2, Math.round(base * (0.6 + rng() * 0.9)));
    push(`▶ Stage: ${name}`);
    const fill = FILLER[name];
    if (i === failIdx) {
      // a couple of filler lines first, then the error lines
      const keep = name === 'Test' ? 0 : Math.min(2, fill.length);
      for (let k = 0; k < keep; k++) { t += 1000; push(sub(fill[k], v)); }
      for (const ln of rule.sample.lines) { t += randInt(rng, 100, 700); push(sub(ln, v)); }
      t += dur * 1000;
      push(`✖ Stage ${name} failed after ${dur}s`);
      stages.push({ name, status: 'failed', durationSec: dur });
    } else {
      fill.forEach(ln => { t += Math.round(dur * 1000 / fill.length); push(sub(ln, v)); });
      push(`✔ Stage ${name} passed in ${dur}s`);
      stages.push({ name, status: 'success', durationSec: dur });
    }
  }
  const durationSec = stages.reduce((s, x) => s + x.durationSec, 0);
  if (rule) {
    push(`##[error] Process completed with exit code 1.`);
    push(`Pipeline finished: FAILED at stage ${failStage}`);
  } else {
    push('Pipeline finished: SUCCESS');
  }
  return { log: out.join('\n'), stages, durationSec, status: rule ? 'failed' : 'success' };
}

/** A log for the analyzer "load sample" dropdown. */
function sampleLogs() {
  const rng = (() => { let a = 7; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();
  return RULES.map(r => ({
    id: r.id, title: r.title,
    log: buildLog({ project: 'sample-service', commit: 'a1b2c3d', message: 'sample run', startedAt: Date.UTC(2026, 10, 1, 9, 30, 0), failRuleId: r.id, rng }).log
  }));
}

function mulberry32(a) {
  return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

module.exports = { buildLog, sampleLogs, mulberry32, STAGES };
