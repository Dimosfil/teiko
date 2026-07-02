# Technology Stack

Last reviewed: 2026-07-02

Canonical source: this file
Linked from: `README.md` and `tools/AGENT_RUNBOOK.md`

## Summary

- Primary stack: Node.js full-stack storefront.
- Runtime model: Express serves API, public static frontend, admin static
  frontend, uploaded assets, and a SQLite database file.
- Current confidence: verified from local files after implementation.

## Components

| Layer | Technology | Evidence | Notes |
| --- | --- | --- | --- |
| Language/runtime | Node.js 24 | `package.json`, `Dockerfile` | ESM modules. |
| Frontend | Static HTML/CSS/vanilla JS | `public/index.html`, `public/app.js`, `public/styles.css` | Public storefront. |
| Admin UI | Static HTML/CSS/vanilla JS | `admin-console/index.html`, `admin-console/admin.js` | Served only at `ADMIN_PATH`, default `/test-admin-teiko`; protected by admin password API header. |
| Backend/API | Express 5 | `src/server.mjs` | Public read API and admin mutation API. |
| Data/storage | SQLite file through `sql.js` | `src/db.mjs` | Local path `data/teiko.sqlite`; Docker path `/app/data/teiko.sqlite`. |
| File uploads | Multer | `src/server.mjs` | Seed images live under `public/uploads/`; Docker admin uploads use `/app/data/uploads`. |
| Build/package | npm, Docker Compose | `package.json`, `docker-compose.yml` | Compose persists database and uploads with volumes. |
| Test/quality | Node smoke script | `scripts/check.mjs` | Checks health and storefront API while app is running. |

## Commands

| Purpose | Command | Evidence |
| --- | --- | --- |
| Install | `npm install` | `package.json` |
| Run | `npm start` | `package.json` |
| Dev run | `npm run dev` | `package.json` |
| Smoke check | `npm run check` | `scripts/check.mjs` |
| Docker | `docker compose up --build` | `docker-compose.yml` |

## External Services

| Service | Role | Evidence | Boundary |
| --- | --- | --- | --- |
| Ozon/Wildberries/Yandex Market/other URLs | External purchase destinations | Product `marketplaceLinks` in SQLite | Site links out; no checkout or payment happens locally. |

## Gaps

- No production authentication/session system yet; MVP admin protection uses
  `ADMIN_PASSWORD`.
- No automated browser/UI test yet.
