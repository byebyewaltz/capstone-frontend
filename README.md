# TaskForge Web

React + Vite frontend for TaskForge, wired to the Express + PostgreSQL API in
`../taskforge-api`. No mock data — every screen reads and writes through real
REST calls with a JWT held in `localStorage`.

## Run it

Start the backend first (see `../taskforge-api/README.md`):

```bash
cd ../taskforge-api
npm install && npm run db:reset && npm run db:seed && npm start   # :3000
```

Then the frontend:

```bash
npm install
npm run dev        # http://localhost:5173
```

Vite proxies `/auth`, `/orgs`, `/notifications` to `http://localhost:3000`, so
the browser talks to a single origin in development.

Sign in with any demo identity (password `password123`): Donna (owner),
Marcus (admin), Priya (member), Leo (viewer). The role you pick changes what the
UI lets you do — Leo can't drag cards or add tasks; Priya can't create projects.

## How it maps to the API

| UI action                      | Endpoint                                            |
| ------------------------------ | --------------------------------------------------- |
| Sign in / create account       | `POST /auth/login`, `POST /auth/register`           |
| Delete account (account menu)  | `DELETE /auth/me`                                    |
| Board load                     | `GET …/projects/:id/columns`, `…/tasks`             |
| Drag a card                    | `POST …/tasks/:id/move { toColumnId, toPosition }`  |
| Add / edit / delete task       | `POST/PATCH/DELETE …/tasks`                          |
| Comments, attachments          | `…/tasks/:id/comments`, `…/attachments`             |
| Notifications bell             | `GET /notifications`, `PATCH …/read`, `…/read-all`  |
| Search box                     | `GET …/projects/search?q=`                          |
| Dashboard charts               | `GET …/projects/analytics`                          |
| Team roles                     | `PATCH/DELETE …/members/:id`                         |

## Structure

```
src/
  api.js          endpoint wrapper + token handling + ApiError
  constants.js    design tokens, role ranks, formatters
  App.jsx         auth/session state, context, view routing
  views/
    AuthGate.jsx  Sidebar.jsx  Topbar.jsx
    Dashboard.jsx Board.jsx    TaskDrawer.jsx
    TeamView.jsx  SettingsView.jsx
  styles.css
```

State is component-local with a shared `dataVersion` counter in context: any
mutation calls `refresh()`, which bumps the counter and triggers dependent views
to refetch. Board moves apply optimistically and roll back on error.
