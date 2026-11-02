# CI Failure Alert and Diagnosis Tool ("CI Sentinel") — Project 82

| Roll no. | Name |
|---|---|
| 24WU0104078 | Mohammed Sajid |
| 24WU0101116 | Raviraj Singh |
| 24WU0104084 | Guru Charan |
| 24WU0101069 | Aditya Patel |

A web platform that watches CI/CD pipelines, **alerts the team the moment a build fails**, and
**diagnoses why**: root cause, confidence score, evidence lines from the log and suggested fixes.

## Run it (no installation needed, zero dependencies)

Requires only **Node.js 18 or newer**.

```bash
cd ci-sentinel
node server.js
```

Open **http://localhost:3000** (use `PORT=4000 node server.js` for another port).
Demo data is generated automatically on first start.

## Pages

| Page | What it does |
|---|---|
| Dashboard | KPIs (success rate, 24h failures, MTTR, avg duration), builds-per-day chart, top failure causes, project health, latest failures and alerts |
| Builds | Filter and search all builds |
| Build detail | Stage timeline, automatic diagnosis, clickable evidence, searchable log viewer, re-run, delete |
| Log Analyzer | Paste or upload any CI log and get an instant diagnosis (22 sample failures built in) |
| Alerts | Live alert centre (failure + recovery), acknowledge one or all |
| Projects | Health ring and build history per repository |
| Settings & Integration | Alert rules, Slack/Discord/Teams webhook, copy-paste CI snippets, demo tools |
| About | Team and architecture |

Live alerts: the server pushes events to every open browser using Server-Sent Events (toast + bell badge).

## Try the full flow

1. Click **Simulate build** (top right) a few times, or use *Settings > Demo tools* to pick a failure type.
2. A toast appears when a build fails. Click it to see the diagnosis and the highlighted log line.
3. Re-run the build. When it turns green, a recovery alert is created.

## Connect a real CI system

```bash
curl -X POST http://localhost:3000/api/webhook -H "Content-Type: application/json" -d '{
  "project":"my-service","branch":"main","commit":"9fceb02","author":"Aditya Patel",
  "message":"Update dependencies","status":"failed","durationSec":142,
  "log":"npm ERR! code ERESOLVE\nnpm ERR! ERESOLVE unable to resolve dependency tree"
}'
```
GitHub `workflow_run` and GitLab pipeline payloads are understood as-is.

## REST API

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/webhook`, `/api/builds` | Ingest a build result |
| GET | `/api/builds?status=&project=&q=&limit=&offset=` | List builds |
| GET / DELETE | `/api/builds/:id` | Build with full log and diagnosis |
| POST | `/api/builds/:id/rerun` | Re-run |
| POST | `/api/analyze` `{log}` | Diagnose any log |
| GET | `/api/stats?days=14`, `/api/projects`, `/api/rules`, `/api/samples` | Analytics and metadata |
| GET / POST | `/api/alerts`, `/api/alerts/:id/ack`, `/api/alerts/ack-all` | Alerts |
| GET / PUT | `/api/settings` (+ `POST /api/settings/test`) | Alert configuration |
| POST | `/api/simulate`, `/api/reset` | Demo tools |
| GET | `/api/events` | Server-Sent Events stream |

## Project structure

```
server.js            HTTP server, REST API, static files
lib/diagnosis.js     Rule-based diagnosis engine (22 failure patterns); add new rules here
lib/builds.js        Build ingestion, alert logic, statistics, seed data
lib/simulator.js     Realistic pipeline-log generator
lib/store.js         JSON-file persistence (data/db.json)
lib/events.js        Server-Sent Events hub
public/              Single-page front end (index.html, styles.css, app.js)
```

## Adding a diagnosis rule

Append an object to `RULES` in `lib/diagnosis.js` with `id`, `title`, `category`, `severity`,
`weight`, `patterns` (regexes), `cause`, `fixes[]` and a `sample`. The sample is also used by the
simulator and the analyzer's "Load a sample" list.
