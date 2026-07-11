# TaskForge — Frontend

React + Vite client for TaskForge, a team project-management app: organizations,
members with roles, kanban boards with drag-and-drop, task comments and
attachments, dashboard analytics, and notifications. It talks to the Express +
PostgreSQL API in `../taskforge-backend` — no mock data; every screen reads and
writes through real REST calls with a JWT held in `localStorage`.

## Tech stack

- **React 18** (hooks + Context API for app state)
- **Vite 5** (dev server proxies `/auth`, `/orgs`, `/notifications` to the API on `:3000`)
- **Recharts** — dashboard charts (status, priority, weekly activity, monthly growth)
- **lucide-react** — icons
- Hand-rolled CSS (`src/styles.css`), no framework

## Quick start

```bash
# 1. Backend (see ../taskforge-backend/README.md)
cd taskforge-backend
npm install
# edit .env -> DATABASE_URL for your Postgres, then:
npm run db:reset && npm run db:seed
npm start                      # http://localhost:3000

# 2. Frontend (new terminal)
cd Capstone-Frontend
npm install
npm run dev                    # http://localhost:5173
```

Sign in with a demo identity (password `password123`):
Donna = owner, Marcus = admin, Priya = member, Leo = viewer. The role changes
what the UI permits, enforced server-side by role-guarded routes.

## Scripts

```bash
npm run dev       # Vite dev server with API proxy
npm run build     # production build to dist/
npm run preview   # serve the production build
npm run lint      # eslint over src/
```

## Layout

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

## Roles

`viewer < member < admin < owner`. Viewers read; members manage tasks,
comments, and attachments; admins manage projects and members; the owner
(exactly one, seated at org creation) has full control.

| Action              | Owner | Admin | Member | Viewer |
| ------------------- | ----- | ----- | ------ | ------ |
| Create organization | ✅    | ✅    | ❌     | ❌     |
| Manage members      | ✅    | ✅    | ❌     | ❌     |
| Create projects     | ✅    | ✅    | ❌     | ❌     |
| Create / edit tasks | ✅    | ✅    | ✅     | ❌     |
| View boards         | ✅    | ✅    | ✅     | ✅     |
