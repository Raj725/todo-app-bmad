# Todo App Frontend

## Overview

This service provides the single-page frontend for the todo app MVP.
It is built with React + TypeScript + Vite and uses TanStack Query for server state.

## Features

- Always-visible quick-add task control
- Task list with loading and empty states
- Immediate feedback for task creation (optimistic UI)
- Inline error and retry affordance on create failures
- In-list complete/incomplete toggle with optimistic updates and rollback on failure
- In-list description edit flow with save/cancel controls, keyboard support, optimistic update, rollback, and retry on failure
- In-list delete flow with lightweight confirmation, optimistic removal, and retry on failure
- Active-first deterministic ordering with clear active/completed status labels
- API envelope validation at the client boundary

## Tech Stack

- React 19
- TypeScript
- Vite
- TanStack Query
- Vitest + Testing Library
- ESLint

## Project Structure

frontend/
- src/
  - app/
  - features/todos/
    - api/
    - components/
    - hooks/
    - types.ts
  - main.tsx
  - setupTests.ts
- package.json

## Prerequisites

- Node.js 20+ recommended
- npm

## Installation

Install dependencies:

```bash
npm install
```

From repository root:

```bash
cd frontend && npm install
```

## Configuration

The frontend reads environment variables from Vite.

- VITE_API_BASE_URL
  - Default: http://127.0.0.1:8000
  - Purpose: backend API base URL for `/todos` requests

Create a local env file if needed:

```bash
echo "VITE_API_BASE_URL=http://127.0.0.1:8000" > .env.local
```

## Running the App

Start development server:

```bash
npm run dev
```

From repository root:

```bash
cd frontend && npm run dev
```

Build for production:

```bash
npm run build
```

From repository root:

```bash
cd frontend && npm run build
```

Preview production build:

```bash
npm run preview
```

From repository root:

```bash
cd frontend && npm run preview
```

## Docker

Build frontend image:

```bash
docker build -t todo-frontend ./frontend
```

Run frontend container (serves static build with Nginx):

```bash
docker run --rm -p 8080:80 todo-frontend
```

When used with the repository `docker-compose.yml`, the frontend routes `/api/*`
requests to the backend service through Nginx.

## Scripts

- `npm run dev` - start Vite dev server
- `npm run build` - type-check and build
- `npm run typecheck` - run TypeScript static type checks (`tsc --noEmit`)
- `npm run test` - run Vitest suite
- `npm run test:coverage` - run Vitest suite with coverage reporting and threshold enforcement (`>=70%`)
- `npm run test:e2e` - run Playwright browser E2E tests
- `npm run test:e2e:ui` - run Playwright in interactive UI mode
- `npm run perf:budget` - build and enforce the main bundle size budget
- `npm run lint` - run ESLint
- `npm run preview` - preview production build

## API Integration

The frontend currently consumes:

- `GET /todos`
- `POST /todos`
- `PATCH /todos/{todo_id}`
- `DELETE /todos/{todo_id}`

Response conventions expected by adapters:

- Success envelope: `{ "data": ... }`
- Snake_case API fields are mapped to camelCase frontend fields in adapters

## Testing

Run all frontend tests:

```bash
npm run test
```

Run frontend tests with coverage gate (`>=70%`):

```bash
npm run test:coverage
```

From repository root:

```bash
cd frontend && npm run test
```

From repository root with coverage gate:

```bash
cd frontend && npm run test:coverage
```

Run browser E2E tests:

```bash
npm run test:e2e
```

Playwright E2E starts both frontend (`127.0.0.1:4173`) and backend (`127.0.0.1:8000`) web servers.
This includes a non-mocked integration check that validates real browser-to-backend CORS behavior.

From repository root:

```bash
cd frontend && npm run test:e2e
```

Run linting:

```bash
npm run lint
```

From repository root:

```bash
cd frontend && npm run lint
```

Run type checking:

```bash
npm run typecheck
```

From repository root:

```bash
cd frontend && npm run typecheck
```

Run the performance budget guardrail:

```bash
npm run perf:budget
```

If the budget check fails, verify if recent dependencies or large assets caused the increase.
To resolve:
- Optimize imports (use tree-shakable imports)
- Lazy load heavy components
- Or increase the limit in `scripts/check-bundle-size.mjs` if the growth is justified.

From repository root:

```bash
cd frontend && npm run perf:budget
```

## CI (Pull Requests)

PR checks are configured in `.github/workflows/tests.yml`.

Frontend-related checks:

- Frontend tests with coverage gate: `npm run test:coverage`
- Frontend lint: `npm run lint`
- Frontend typecheck: `npm run typecheck`
- Frontend E2E: `npm run test:e2e`
- Frontend performance budget: `npm run perf:budget`

Run all locally before opening or updating a PR:

```bash
npm run typecheck
npm run test:coverage
npm run lint
npm run test:e2e
npm run perf:budget
```

If the E2E job fails in CI, open the failed GitHub Actions run and download the `playwright-artifacts` bundle to inspect the HTML report, traces, screenshots, and videos.

## Troubleshooting

- If API calls fail locally, verify backend is running and `VITE_API_BASE_URL` is correct.
- If `npm run test:e2e` fails to start backend, install backend dependencies:
  - `cd backend && python3 -m pip install -r requirements.txt`
- If `npm run typecheck` fails, fix TypeScript errors before running build/test.
- If `npm run perf:budget` fails, reduce bundle size or adjust the agreed Story 4.4 budget threshold.
- If port 5173 is busy, Vite will prompt for another port.
- If tests fail after dependency changes, reinstall with `npm install`.

## Notes

- This frontend is intentionally minimal and scoped to MVP behavior.
- Keep API transport and envelope parsing inside `features/todos/api/*` to preserve boundaries.
