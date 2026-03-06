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

## Scripts

- `npm run dev` - start Vite dev server
- `npm run build` - type-check and build
- `npm run test` - run Vitest suite
- `npm run lint` - run ESLint
- `npm run preview` - preview production build

## API Integration

The frontend currently consumes:

- `GET /todos`
- `POST /todos`
- `PATCH /todos/{todo_id}`

Response conventions expected by adapters:

- Success envelope: `{ "data": ... }`
- Snake_case API fields are mapped to camelCase frontend fields in adapters

## Testing

Run all frontend tests:

```bash
npm run test
```

From repository root:

```bash
cd frontend && npm run test
```

Run linting:

```bash
npm run lint
```

From repository root:

```bash
cd frontend && npm run lint
```

## CI (Pull Requests)

PR checks are configured in `.github/workflows/tests.yml`.

Frontend-related checks:

- Frontend tests: `npm run test`
- Frontend lint: `npm run lint`

Run both locally before opening or updating a PR:

```bash
npm run test
npm run lint
```

## Troubleshooting

- If API calls fail locally, verify backend is running and `VITE_API_BASE_URL` is correct.
- If port 5173 is busy, Vite will prompt for another port.
- If tests fail after dependency changes, reinstall with `npm install`.

## Notes

- This frontend is intentionally minimal and scoped to MVP behavior.
- Keep API transport and envelope parsing inside `features/todos/api/*` to preserve boundaries.
