# TaskForge

**Full-stack team project management** — organizations, role-based membership, drag-and-drop Kanban boards, task comments and attachments, dashboard analytics, and notifications. A simplified Trello / Asana / Jira, built in two parts:

<<<<<<< HEAD
# TaskForge — Tech Stack & Architecture

A full-stack project management application (Kanban boards, task tracking, team & organization management, analytics) in the style of Trello / Asana / Jira.

---

## Overview

| Layer             | Technology                                |
| ----------------- | ----------------------------------------- |
| Runtime           | Node.js (ES modules)                      |
| Backend framework | Express 5                                 |
| Database          | PostgreSQL                                |
| Auth              | JWT + bcryptjs, role-based access control |
| Frontend          | React 18 + Vite                           |
| Routing (client)  | React Router 6                            |
| Drag & drop       | @hello-pangea/dnd                         |
| Charts            | Recharts                                  |

---

## Backend

### Runtime & Module System

- **Node.js with native ES modules**
- **Subpath imports** for clean internal resolution:
  - `#db/*` — database client and queries
  - `#middleware/*` — auth, validation, error handling
  - `#routes/*` — Express routers

### Framework — Express 5

- **Nested routers with `mergeParams: true`** — resources like tasks mount under boards, boards under organizations, with parent params flowing down.
- **`router.param()` middleware** — centralizes 404 handling and attaches the loaded record to `req`, so route handlers never re-fetch or re-check existence.
- **`requireBody` validation middleware** — declarative required-field checks before handlers run.
- **Central error handler** — maps PostgreSQL error codes (e.g. `23505` unique violation, `23503` foreign key violation) to appropriate HTTP responses.
- **Route ordering discipline** — auth checks before existence checks to avoid information leakage.

### Database — PostgreSQL

- **Parameterized queries** throughout (no string interpolation).
- **Transactions with `SELECT ... FOR UPDATE`** for operations requiring row-level locking (e.g. fractional position reordering, org membership changes).
- **Cross-organization data isolation** enforced at the query level; JOINs scoped by organization to prevent leakage between tenants.

### Authentication & Authorization

- **bcryptjs** for password hashing.
- **JWT** bearer tokens for stateless session auth.
- **RBAC hierarchy:** `owner > admin > member > viewer`, enforced in middleware with role-comparison guards (verified via mutation testing).

### Organization Features

- Auto-join organization on registration
- Organization switching
- Assign-to-org flows
- Org deletion with typed confirmation and safe member adoption

## Frontend

### Core

- **React 18** bootstrapped with **Vite**
- **React Router 6** for client-side routing

### Key Libraries

- **@hello-pangea/dnd** — drag-and-drop Kanban board with **fractional positioning** (cards get positions like 1.5 between 1 and 2, avoiding full-column renumbering on every move).
- **Recharts** — analytics dashboard:
  - Weekly activity grouped bar chart
  - Monthly growth composed chart

### Component Surface

- `Board.jsx` — Kanban columns and drag-and-drop
- `TaskDrawer.jsx` — task detail panel
- `Topbar.jsx` / `Sidebar.jsx` — navigation and org switching
- `Dashboard.jsx` — analytics charts
- `TeamView.jsx` — member management with role hierarchy enforcement and inline confirmation flows

### Design System — "Drafting Sheet"

- **Accent:** terracotta `#C4623D`
- **Background:** warm paper `#F4EFE6`
- **Type stack:** Fraunces (display) / Inter (body) / IBM Plex Mono (data & code)
- Editorial, ledger-inspired aesthetic carried through charts and UI chrome

---

## Engineering Practices

- End-to-end verification against a **live database** rather than assumed behavior
- **Integration bug detection** by cross-referencing API response shapes against component expectations
- **Mutation testing** applied to security guard middleware
- Growing test suite covering auth, RBAC, org isolation, and CRUD flows
- Security-first review cadence — two cross-org isolation vulnerabilities and an org-deletion regression identified and patched

- **React 18** (hooks + Context API for app state)
- **Vite 5** (dev server proxies `/auth`, `/orgs`, `/notifications` to the API on `:3000`)
- **Recharts** — dashboard charts (status, priority, weekly activity, monthly growth)
- **lucide-react** — icons
- Hand-rolled CSS (`src/styles.css`), no framework

# TaskForge — full-stack team project management

This platform uses relational data modeling, SQL (joins, aggregates, CTEs, transactions, locking), REST API design, Express middleware architecture, JWT auth + bcrypt, role-based authorization and multi-tenant isolation, centralized error handling, React with Context/hooks, optimistic UI and drag-and-drop, client-side API abstraction, data visualization with Recharts, seeding/demo-data engineering, API testing, and environment-based configuration.
=======
- **`taskforge-backend/`** — Express 5 + PostgreSQL REST API with JWT auth, role-based access control, a normalized schema, transactional drag-and-drop, and a growing test suite.
- **`taskforge-frontend/`** — React + Vite client wired directly to that API. No mock data — every screen reads and writes through real REST calls.

The through-line: **every rule is enforced at the right layer.** The database constrains what can exist, the API constrains who can do what, and the UI merely reflects those rules back to the user.

---
>>>>>>> eebcff35f5fececedbb40f8aa7e28f2eb44d27d7

## Tech Stack

<<<<<<< HEAD
# Tech Stack

Frontend
React 19
React Router
Context API
Redux Toolkit
Chart.js
React Hook Form
Tailwind CSS
Framer Motion

Backend
Express.js
Node.js
PostgreSQL
JWT Authentication
bcrypt
Socket.io (notifications)
Database

A simplified Trello/Asana/Jira in two parts:

- **taskforge-backend/** — Express 5 + PostgreSQL REST API (JWT auth, RBAC,
  normalized schema, transactional drag-and-drop, 18-test suite).
- **taskforge-frontend/** — React + Vite frontend wired to that API (no mock data).

## Quick start
=======
| Layer              | Technology                                 |
| ------------------ | ------------------------------------------ |
| Runtime            | Node.js (native ES modules)                |
| Backend framework  | Express 5                                  |
| Database           | PostgreSQL                                 |
| Auth               | JWT + bcryptjs, role-based access control  |
| Frontend           | React 18 + Vite 5                          |
| Routing (client)   | React Router 6                             |
| State              | React Context + hooks                      |
| Drag & drop        | @hello-pangea/dnd                          |
| Charts             | Recharts                                   |
| Icons              | lucide-react                               |
| Styling            | Hand-rolled CSS (`src/styles.css`)         |

---

## Quick Start
>>>>>>> eebcff35f5fececedbb40f8aa7e28f2eb44d27d7

```bash
# 1. Backend (see taskforge-backend/README.md)
cd taskforge-backend
npm install
# edit .env -> DATABASE_URL for your Postgres, then:
npm run db:reset && npm run db:seed
npm start                      # http://localhost:3000

# 2. Frontend (new terminal)
cd taskforge-frontend
npm install
npm run dev                    # http://localhost:5173
```

Sign in with a demo identity (password `password123`):

| User   | Role   |
| ------ | ------ |
| Donna  | Owner  |
| Marcus | Admin  |
| Priya  | Member |
| Leo    | Viewer |

The role changes what the UI permits — and every permission is enforced server-side by role-guarded routes, not just hidden buttons.

### Scripts

```bash
npm run dev       # Vite dev server with API proxy
npm run build     # production build to dist/
npm run preview   # serve the production build
npm run lint      # eslint over src/
```

---

## Architecture

### Backend

**Runtime & modules.** Node.js with native ES modules and **subpath imports** for clean internal resolution:

- `#db/*` — database client and queries
- `#middleware/*` — auth, validation, error handling
- `#routes/*` — Express routers

**Express 5 patterns.**

- **Nested routers with `mergeParams: true`** — tasks mount under boards, boards under organizations, with parent params flowing down naturally.
- **`router.param()` middleware** — centralizes 404 handling and attaches the loaded record to `req`, so route handlers never re-fetch or re-check existence.
- **`requireBody` validation middleware** — declarative required-field checks before any handler runs.
- **Central error handler** — maps PostgreSQL error codes (`23505` unique violation, `23503` foreign-key violation) to appropriate HTTP responses.
- **Route ordering discipline** — auth checks precede existence checks, so unauthenticated callers can't probe which resources exist.

**PostgreSQL.**

- Parameterized queries throughout — no string interpolation, anywhere.
- Transactions with `SELECT ... FOR UPDATE` for operations requiring row-level locking, such as fractional position reordering and org membership changes.
- **Cross-organization isolation enforced at the query level** — every JOIN is scoped by organization, preventing any leakage between tenants.

**Auth & authorization.**

- bcryptjs password hashing; stateless JWT bearer tokens.
- RBAC hierarchy `owner > admin > member > viewer`, enforced in middleware with role-comparison guards — verified via mutation testing.

**Organization lifecycle.**

- Auto-join on registration
- Organization switching and assign-to-org flows
- Org deletion with typed confirmation and safe member adoption

### Frontend

React 18 bootstrapped with Vite; React Router 6 for client-side navigation; Context + hooks for app state. The Vite dev server proxies `/auth`, `/orgs`, and `/notifications` to the API on `:3000`. Auth is a JWT held in `localStorage`, managed by a single fetch wrapper.

**Key pieces:**

- **@hello-pangea/dnd** powers the Kanban board with **fractional positioning** — a card dropped between positions 1 and 2 lands at 1.5, avoiding a full-column renumber on every move — paired with optimistic UI updates.
- **Recharts** drives the analytics dashboard: task status and priority breakdowns, a weekly activity grouped bar chart, and a monthly growth composed chart.

**Layout:**

```
index.html            entry document
src/main.jsx          mounts <App />
src/App.jsx           session boot, org selection, view routing, app context
src/api.js            fetch wrapper + typed ApiError, JWT handling, all endpoints
src/constants.js      theme colors, roles, priorities, small format helpers
src/styles.css        all styling
src/views/            AuthGate, Sidebar, Topbar, Dashboard, Board, TaskDrawer,
                      TeamView, SettingsView
```

### Design System — "Drafting Sheet"

An editorial, ledger-inspired aesthetic carried through every chart and piece of UI chrome:

- **Accent:** terracotta `#C4623D`
- **Background:** warm paper `#F4EFE6`
- **Type stack:** Fraunces (display) · Inter (body) · IBM Plex Mono (data & code)

---

## Roles & Permissions

`viewer < member < admin < owner`. Viewers read; members manage tasks, comments, and attachments; admins manage projects and members; the owner (exactly one, seated at org creation) has full control.

| Action              | Owner | Admin | Member | Viewer |
| ------------------- | :---: | :---: | :----: | :----: |
| Create organization |  ✅   |  ✅   |   ❌   |   ❌   |
| Manage members      |  ✅   |  ✅   |   ❌   |   ❌   |
| Create projects     |  ✅   |  ✅   |   ❌   |   ❌   |
| Create / edit tasks |  ✅   |  ✅   |   ✅   |   ❌   |
| View boards         |  ✅   |  ✅   |   ✅   |   ✅   |

---

## Engineering Practices

- **End-to-end verification against a live database** rather than assumed behavior.
- **Integration bug detection** by cross-referencing API response shapes against component expectations — not assuming they match.
- **Mutation testing** applied to the security guard middleware.
- A growing test suite covering auth, RBAC, org isolation, and CRUD flows.
- A **security-first review cadence** — two cross-org isolation vulnerabilities and an org-deletion regression were identified and patched during development.

---

## Skills Demonstrated

**Data & backend:** relational data modeling · SQL (joins, aggregates, CTEs, transactions, row-level locking) · REST API design · Express middleware architecture · JWT auth + bcrypt · role-based authorization · multi-tenant isolation · centralized error handling · seeding and demo-data engineering · API testing · environment-based configuration

**Frontend:** React with Context and hooks · optimistic UI · drag-and-drop interaction · client-side API abstraction · data visualization with Recharts · design-system-driven styling
