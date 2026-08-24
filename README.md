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