# Life Dashboard

Behavioral-science habit tracker. Daily streaks render as a chain. Variable
rewards keep the loop alive. Per-user data via `mw-backend`; iframe-embedded
into `michaelwegter.com` at `/apps/life-dashboard`.

## Develop

```bash
npm install
npm run dev          # localhost:5180 (calls https://api.michaelwegter.com)
npm run dev:local    # localhost:5180 (calls http://localhost:5050)
npm run build        # production build → dist/
```

For local end-to-end work you'll usually want three terminals:

```bash
# 1. mw-backend
cd ../mw-backend && ./start.sh

# 2. life-dashboard
cd ../life-dashboard && npm run dev:local

# 3. michaelwegter.com (iframes life-dashboard at localhost:5180)
cd ../michaelwegter.com && npm run dev:local
```

## Architecture

- **State**: `state/AppState.jsx` is a `useReducer` + Context store of habits,
  completions, and reflections. Mutations are optimistic — the UI updates
  immediately, the backend write is fire-and-forget, and failures roll back
  with a toast.
- **Auth**: `state/AuthProvider.jsx` exposes `{ user, login, register, logout }`.
  Anonymous users get an `X-Device-Token` (see `lib/deviceToken.js`); on
  register/login the backend's `_claim_device` migrates their rows.
- **API**: `lib/api.js` — single fetch wrapper that picks up either the JWT or
  the device token from localStorage and adds it to every request.
- **Logic**: `lib/{dates,frequency,scoring,levels,badges,categories}.js` are
  pure functions ported verbatim from the design prototype (`design_handoff_life_dashboard/`).
- **Components**: `components/` — one per design panel. No business logic
  beyond rendering and event dispatch.
- **Logo**: `components/Logo.jsx` exports `<Logo>` (wordmark) and `<LogoMark>`
  (square icon). Same SVG geometry is duplicated as `LifeDashboardGlyph` in
  `michaelwegter.com/src/components/MacDesktop.jsx` so the brand reads the
  same on the apps page.

## Backend contract

The Life Dashboard slice of `mw-backend` lives at `/api/life/*`:

| Method | Path                                          | Purpose                              |
|--------|-----------------------------------------------|--------------------------------------|
| GET    | `/api/life/state`                             | habits + completions + reflections   |
| PUT    | `/api/life/habits/<id>`                       | upsert habit                         |
| DELETE | `/api/life/habits/<id>`                       | delete habit + its completions       |
| POST   | `/api/life/completions`                       | upsert one (habit, date) completion  |
| DELETE | `/api/life/completions/<habit_id>/<date>`     | remove one completion                |
| PUT    | `/api/life/reflections/<date>`                | set / clear reflection text          |

All routes are decorated with `@require_owner`, which accepts either
`Authorization: Bearer <jwt>` or `X-Device-Token: <token>` and namespaces
data by `(owner_type, owner_id)`.

Tables: `life_habits`, `life_completions`, `life_reflections`. Schema in
`mw-backend/server.py` next to the existing growyard/gallery tables.

## Deploy

GitHub Pages workflow lives at `.github/workflows/deploy.yml`. Push to
`main` → Pages action runs `npm run build` with
`VITE_API_BASE=https://api.michaelwegter.com` and publishes `dist/`.

For the portfolio iframe to pick it up, the production URL must match
`michaelwegter.com/src/data/apps.js`'s `LIFE_DASHBOARD_URL` default
(`https://mwegter95.github.io/life-dashboard/`). Override per-environment
via `VITE_LIFE_DASHBOARD_URL`.
