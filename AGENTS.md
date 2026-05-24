# SOOP Station Comment Ranker

## Architecture

- Two packages, no monorepo tool — each has independent `package.json` and `node_modules/`.
- **`backend/`** — Express.js (CommonJS), entrypoint `backend/index.js`, listens on `PORT` (default 5000).
  - Scrapes SOOP API at `https://api-channel.sooplive.com/v1.1/channel/{bj_id}/post/{post_id}/comment`
  - In-memory cache with 2.5s TTL, cleanup every 30s.
  - Catch-all route (`app.get(/^.*$/)`) serves `frontend/dist/index.html` — SPA fallback.
  - Compiles to standalone Windows `.exe` via `pkg` (see `backend/package.json`).
- **`frontend/`** — React 19 + TypeScript + Vite + Tailwind CSS v4.
  - Single component in `frontend/src/App.tsx`. Entry: `frontend/src/main.tsx`.
  - Calls `{VITE_API_URL}/api/comments?url={soopUrl}`. Auto-refreshes every 3s with `AbortController` for race condition safety.
  - `VITE_API_URL` env var (default `http://localhost:5000`), set in `frontend/.env`.
  - Dark mode persisted in `localStorage` key `theme`.
- **`soop-ranker-portable/`** — Pre-built standalone `.exe`.

## Commands

| Action | Command |
|--------|---------|
| Start backend | `cd backend && node index.js` |
| Frontend dev server | `cd frontend && npm run dev` |
| Build frontend | `cd frontend && npm run build` (runs `tsc -b && vite build`) |
| Lint frontend | `cd frontend && npm run lint` |
| Build portable .exe | `cd backend && npm run build` |
| Run backend tests | `cd backend && npx jest` (Jest + supertest) |
| Run frontend tests | `cd frontend && npx jest` (Jest + ts-jest + jsdom) |
| Run a single test file | `cd <dir> && npx jest <path>` |

## Tests

- **Backend**: `backend/tests/api.test.js` — supertest-based API tests (missing URL, invalid URL).
- **Frontend**: `frontend/src/logic.test.ts` — unit tests for ranking stability and HTML entity sanitization.
- **Frontend test setup**: `frontend/src/setupTests.ts` — imports `@testing-library/jest-dom`, polyfills `TextEncoder`/`TextDecoder`.
- **Jest config** (`frontend/jest.config.cjs`): uses `ts-jest` preset, `jsdom` environment, mocks CSS/image imports via `identity-obj-proxy` and file mock.
- No test script in either `package.json` — always use `npx jest`.

## Notable Rules

- `backend/` is CommonJS; `frontend/` is ESM (`"type": "module"`).
- Frontend TypeScript is strict (`noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`).
- UI is Korean. Error strings and UI text are in Korean.
- Backend cache uses `Map` with `unref()` timer — don't import an external cache lib.
- Deploy: backend on Render.com (root = `backend`), frontend on Vercel (root = `frontend`, framework = Vite, env = `VITE_API_URL`). See `DEPLOY.md`.
