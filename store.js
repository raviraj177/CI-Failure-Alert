'use strict';
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DIR, 'db.json');

const defaults = () => ({
  builds: [],
  alerts: [],
  counters: {},
  settings: {
    notifyOnFailure: true,
    notifyOnRecovery: true,
    branchFilter: 'all',      // 'all' | 'main'
    minSeverity: 'low',       // low | medium | high | critical
    webhookUrl: ''
  }
});

let db = defaults();
let timer = null;

function load() {
  try {
    const raw = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    db = Object.assign(defaults(), raw);
    db.settings = Object.assign(defaults().settings, raw.settings || {});
  } catch (_) { db = defaults(); }
  return db;
}

function saveNow() {
  try {
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(FILE + '.tmp', JSON.stringify(db));
    fs.renameSync(FILE + '.tmp', FILE);
  } catch (e) { console.error('Could not save database:', e.message); }
}

function save() {
  clearTimeout(timer);
  timer = setTimeout(saveNow, 150);
}

function reset() { db = defaults(); saveNow(); return db; }

module.exports = { load, save, saveNow, reset, get db() { return db; } };
