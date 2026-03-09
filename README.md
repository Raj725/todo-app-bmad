# todo-app-bmad-agile

## Overview

This repository contains a full-stack Todo MVP:

- Frontend: React + TypeScript + Vite (in `frontend/`)
- Backend: FastAPI + SQLAlchemy + Alembic (in `backend/`)

## Repository Layout

- `frontend/` - web UI service
- `backend/` - API service and database layer
- `docs/` - project knowledge and planning references

## Prerequisites

- Node.js 20+ and npm
- Python 3.11+ and pip

## Quick Start (Run Both Services)

### 1) Install dependencies

```bash
cd frontend && npm install
cd ../backend && python3 -m pip install -r requirements.txt
```

### 2) Configure backend env

```bash
cd backend
cp .env.example .env
```

### 3) Run database migrations

```bash
cd backend
python3 -m alembic upgrade head
```

### 4) Start backend (Terminal 1)

```bash
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 5) Start frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

### 6) Open the app

- Frontend: http://127.0.0.1:5173
- Backend API docs: http://127.0.0.1:8000/docs

## Docker Compose Quick Start

Start the full stack with containers:

```bash
docker compose up --build
```

Endpoints:

- Frontend: http://localhost:8080
- Backend API docs: http://localhost:8000/docs

Stop and remove containers:

```bash
docker compose down
```

## Common Commands

### Frontend

```bash
cd frontend
npm run dev
npm run test
npm run lint
npm run build
npm run preview
```

### Backend

```bash
cd backend
python3 -m alembic upgrade head
python3 -m pytest -q
python3 tests/test_health_readiness.py
python3 tests/test_todo_create.py
```

## CI (Pull Requests)

PR checks are defined in `.github/workflows/tests.yml` and run:

- Backend tests
- Frontend tests
- Frontend lint

Run the same checks locally before opening or updating a PR:

```bash
cd backend && python3 -m pytest -q
cd frontend && npm run test
cd frontend && npm run lint
```

## Environment Variables

### Frontend

- `VITE_API_BASE_URL` (default in code: `http://127.0.0.1:8000`)

Optional local file:

```bash
cd frontend
echo "VITE_API_BASE_URL=http://127.0.0.1:8000" > .env.local
```

### Backend

- `DATABASE_URL` (default: `sqlite:///./todo.db`)
- `CORS_ALLOW_ORIGINS` (default: `http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173`)

Configured via:

```bash
cd backend
cp .env.example .env
```

## Troubleshooting

- If backend tests fail with missing pytest:
  - `cd backend && python3 -m pip install -r requirements.txt`
- If migration errors occur:
  - `cd backend && python3 -m alembic upgrade head`
- If frontend cannot reach backend:
  - confirm backend is running on `127.0.0.1:8000`
  - check `VITE_API_BASE_URL` in `frontend/.env.local`
  - if browser reports CORS blocked, verify backend `CORS_ALLOW_ORIGINS` includes frontend origin and restart backend

## Service Docs

- Frontend details: `frontend/README.md`
- Backend details: `backend/README.md`

## Process Guardrails

### Documentation Ownership

- The implementing developer/agent for a service change owns updating that service README.
- The reviewer owns enforcing README parity during code review.
- Ownership must be explicit in story/review records when a service is touched.

### Definition of Done and Review Policy (Mandatory)

- README update required for any service change.
- If there is no README impact, the story/review must include explicit "No README impact" rationale.
- A story is not Done/Review-Pass unless README parity is validated for affected services, including:
  - run commands
  - test commands
  - environment variables
  - database/migration commands (backend)

### Reusable Template for Non-BMAD Workflows

- Use `docs/process/documentation-governance.md` as the standard ownership + checklist template in any workflow.

### Branch + PR Workflow (Balanced)

- Use `docs/process/git-branch-pr-governance.md` for branch naming, PR sizing balance, and completion checklist.
