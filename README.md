# Scheduled Report Generator

A production-style backend + Angular 22 frontend that automatically generates PDF/Excel reports on user-defined schedules, tracks every run's outcome, and serves a live dashboard — built to demonstrate dynamic cron scheduling, resilient async operations, and correct RxJS operator selection under real, justified use cases.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [How Scheduling Works](#how-scheduling-works)
- [RxJS Operators — What's Used and Why](#rxjs-operators--whats-used-and-why)
- [SSR & Hydration](#ssr--hydration)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Roadmap](#roadmap)

---

## Overview

Real businesses need recurring reports — weekly sales summaries, monthly digests — generated automatically, not manually exported by a person every time. This project builds that:

1. A user defines a **Report Template**: what data it covers, how often it runs (daily/weekly/monthly), what time, and the output format (PDF/Excel).
2. A **dynamic cron scheduling engine** — built on `SchedulerRegistry`, not hardcoded decorators — registers a live job for every active template, computed from its stored schedule.
3. When a job fires, the backend generates the actual file, tracking the attempt as a **Report Run** (`PENDING` → `SUCCESS`/`FAILED`) with full timestamps and error capture.
4. Users manage templates and browse run history — including live-updating stats and bulk actions — from an Angular 22 frontend.

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **NestJS** | REST API framework |
| **@nestjs/schedule** | Dynamic cron job registration via `SchedulerRegistry` |
| **Prisma ORM** | Type-safe database access + migrations |
| **PostgreSQL** | Relational database |
| **pdfkit** | PDF report generation |
| **exceljs** | Excel report generation |

### Frontend
| Technology | Purpose |
|---|---|
| **Angular 22** | Standalone components, zoneless change detection, SSR |
| **Signals + `toSignal()`** | Reactive state, bridging RxJS streams into templates |
| **RxJS** | `switchMap`, `concatMap`, `mergeMap`, `retry`, `catchError`, `forkJoin`, `combineLatest` |
| **Reactive Forms** | Typed, validated schedule configuration |
| **Bootstrap 5** | UI styling and layout |

---

## Architecture
┌──────────────────────┐ REST API ┌────────────────────┐
│ Angular 22 SSR App │ ────────────────────────▶│ NestJS Backend │
│ (Signals + RxJS) │◀──────────────────────── │ │
└──────────────────────┘ JSON / file blob └──────────┬─────────┘
│
┌─────────┴─────────┐
│ SchedulerRegistry │
│ (dynamic cron) │
└─────────┬─────────┘
│
┌─────────┴─────────┐
│ Prisma ORM │
└─────────┬─────────┘
│
┌─────────┴─────────┐
│ PostgreSQL │
└────────────────────┘
│
┌─────────┴─────────┐
│ generated-reports/ │
│ (PDF/Excel files) │
└────────────────────┘


---

## How Scheduling Works

Cron decorators (`@Cron('0 6 * * *')`) are fixed at compile time — they can't represent a schedule a user configures dynamically through an API. This project instead:
App startup
│
▼
Load all ReportTemplate rows where isActive = true
│
▼
For each template: convert (frequency + time + dayOfWeek) → cron expression
│
▼
Register a live CronJob via SchedulerRegistry.addCronJob()
│
▼
Job fires on schedule ──▶ ReportGeneratorService.generate()
│
├── Create ReportRun (status: PENDING)
├── Fetch report data
├── Write PDF (pdfkit) or Excel (exceljs) to disk
├── SUCCESS ──▶ update ReportRun with filePath
└── FAILED ──▶ update ReportRun with errorMessage


**Why the database is the source of truth, not in-memory state:** every job is rebuilt fresh from the database on every server restart — schedules don't rely on the Node process "remembering" anything across a restart, which is what makes them durable and easy to reason about. Creating, updating, or deleting a template through the API immediately re-registers or removes its corresponding live job — no server restart required.

**Overlap protection:** an in-memory guard prevents the same template from running twice concurrently if a previous generation is still in progress. Noted as a scaling limitation below (see Roadmap) — this guard is per-process, so it wouldn't hold across multiple server instances.

---

## RxJS Operators — What's Used and Why

Each operator below was chosen for a specific, real reason tied to an actual feature — not used arbitrarily.

| Operator | Feature | Why this one |
|---|---|---|
| `debounceTime` + `distinctUntilChanged` | Template search | Avoid firing a request on every keystroke |
| `switchMap` | Search, Polling | Cancel the previous in-flight request — only the latest result should ever apply |
| `concatMap` | Bulk status toggle | Operations must run strictly in order, and none may be silently dropped |
| `mergeMap` (with concurrency limit) | Bulk file download | Independent operations — safe to run in parallel, capped to avoid overwhelming the browser/server |
| `retry` | Polling, downloads | Transient failures (network blips) often resolve themselves on a quick re-attempt |
| `catchError` | Polling, downloads | Prevents one failure from killing an entire stream or batch operation |
| `forkJoin` | Dashboard initial load | Wait for multiple one-time requests to all complete before rendering |
| `combineLatest` | Dashboard live stats | Recombine multiple independently-polling sources whenever any one of them updates |
| `toSignal()` | Everywhere | Bridges RxJS streams into Signals with automatic unsubscribe on component destroy |

---

## SSR & Hydration

This frontend is built with Angular's server-side rendering enabled (`--ssr=true`), plus client hydration (`provideClientHydration(withEventReplay())`):

- The server renders full HTML on first request — visible via `view-source:`, before any JavaScript executes.
- The client then **hydrates** that existing DOM rather than discarding and re-rendering it.
- `withEventReplay()` captures any user interaction (e.g., a click) that happens *during* the hydration window and replays it once hydration completes, so no click is silently lost.
- Browser-only APIs (`window`, `document`, `localStorage`) are only safe to call from event handlers or inside `afterNextRender()` — never from a constructor or lifecycle hook that could run during server rendering, since those APIs don't exist in Node.

---

## Project Structure

report-generator/
├── backend/
│ └── src/
│ ├── prisma/ PrismaService (global injectable)
│ ├── reports/
│ │ ├── cron-expression.util.ts Frequency/time -> cron string
│ │ ├── report-scheduler.service.ts SchedulerRegistry integration
│ │ └── report-generator.service.ts PDF/Excel generation + overlap guard
│ ├── report-templates/ CRUD API, live-syncs the scheduler
│ └── report-runs/ History, stats, streamed file download
│
├── frontend/
│ └── src/app/
│ ├── core/
│ │ ├── services/ ReportTemplateService, ReportRunService
│ │ └── models/ Typed interfaces matching backend DTOs
│ ├── features/
│ │ ├── dashboard/ forkJoin + combineLatest
│ │ ├── report-templates/ search (switchMap), bulk toggle (concatMap)
│ │ └── report-runs/ polling (switchMap+retry), bulk download (mergeMap)
│ └── layout/shell/ Persistent navbar, nested routing
│
└── README.md


---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (local install, no Docker)
- Angular CLI 22+

### Backend

```bash
cd backend
npm install
cp .env.example .env   # set DATABASE_URL
```

```sql
CREATE DATABASE report_generator_db;
```

```bash
npx prisma migrate dev
npm run start:dev       # runs at http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
ng serve                # dev mode, no SSR, http://localhost:4200

# OR, to test the full SSR build:
npm run build
npm run serve:ssr:frontend   # http://localhost:4000
```

---

## API Reference

### Report Templates — `/report-templates`
| Method | Path | Description |
|---|---|---|
| POST | `/report-templates` | Create a template, registers its cron job live |
| GET | `/report-templates?search=` | List/search templates |
| GET | `/report-templates/:id` | Single template |
| PATCH | `/report-templates/:id` | Update, re-registers the job if schedule changed |
| DELETE | `/report-templates/:id` | Delete, unregisters the job |
| PATCH | `/report-templates/:id/toggle-status` | Pause/resume the schedule without deleting |
| POST | `/report-templates/:id/trigger` | Manually run a template immediately |

### Report Runs — `/report-runs`
| Method | Path | Description |
|---|---|---|
| GET | `/report-runs?templateId=` | List run history, optionally filtered |
| GET | `/report-runs/:id` | Single run detail |
| GET | `/report-runs/:id/download` | Stream the generated file |
| GET | `/report-runs/stats/summary` | Aggregate counts by status |

---

## Roadmap

- [x] Dynamic cron scheduling engine, rebuilt from DB on every restart
- [x] PDF + Excel generation with run tracking and error capture
- [x] Full CRUD API with live scheduler sync
- [x] Angular 22 SSR frontend with search, bulk actions, live dashboard
- [ ] Distributed overlap lock (Redis) — current in-memory guard doesn't hold across multiple server instances
- [ ] Email delivery of generated reports, not just in-app download
- [ ] Additional report types beyond Orders Summary
- [ ] Authentication/RBAC (currently open, single-tenant)

---

## Author

**Druthvik S**
Full Stack Developer — Angular | Node.js | TypeScript | AWS
[GitHub](https://github.com/Druthvikkratos)