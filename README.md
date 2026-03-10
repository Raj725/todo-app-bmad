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
cp .env.example .env
docker compose up --build
```

Endpoints:

- Frontend: http://localhost:8080
- Backend API docs: http://localhost:8000/docs

Stop and remove containers:

```bash
docker compose down
```

### Docker Compose Profiles (`dev` and `test`)

Profile behavior is additive. The default stack (`db`, `backend`, `frontend`) still starts with no profile.

- `dev` profile enables the `compose-dev-check` helper container for in-network smoke verification.
- `test` profile enables the `backend-test-gate` helper container to run backend pytest inside compose.

Validate resolved config for each workflow:

```bash
docker compose config
docker compose --profile dev config
docker compose --profile test config
```

Run default workflow (baseline onboarding path):

```bash
docker compose up --build -d
docker compose ps
docker compose down
```

Run dev profile workflow:

```bash
docker compose --profile dev up --build -d
docker compose --profile dev ps
curl -sSf http://localhost:8080/
curl -sSf http://localhost:8000/health
curl -sSf http://localhost:8000/ready
docker compose --profile dev down
```

Run test profile workflow:

```bash
docker compose --profile test up --build backend-test-gate
docker compose --profile test down
```

> **Note:** The test profile runs against the same database volume as the default/dev stack. Run `docker compose down -v` before test runs if you need a clean database for isolation.

### Docker Runtime Hardening Verification (Frontend)

The frontend image is intentionally multi-stage and includes a Dockerfile-level
`HEALTHCHECK` for container runtime parity. To validate runtime hardening,
health checks, SPA fallback, and `/api` proxy behavior:

```bash
docker compose build frontend
docker compose up -d
docker compose ps
curl -sSf http://localhost:8080/
curl -sSf http://localhost:8000/health
curl -sSf http://localhost:8080/api/health
curl -sS http://localhost:8080/non-existent-client-route | grep -qi "todo"
docker compose down
```

Expected outcomes:

- `docker compose ps` shows frontend as `healthy`.
- Frontend root and backend health endpoints return success.
- Frontend `/api/health` proxies to backend successfully.
- Non-file SPA routes return the frontend app shell.

## Common Commands

### Frontend

```bash
cd frontend
npm run dev
npm run test
npm run test:coverage
npm run test:e2e
npm run lint
npm run typecheck
npm run build
npm run preview
```

### Backend

```bash
cd backend
python3 -m alembic upgrade head
python3 -m pytest -q
python3 -m pytest -q --cov=app --cov-report=term-missing --cov-fail-under=70
python3 tests/test_health_readiness.py
python3 tests/test_todo_create.py
```

## CI (Pull Requests)

PR checks are defined in `.github/workflows/tests.yml` and run:

- Backend tests with coverage gate (`>=70%`)
- Frontend tests with coverage gate (`>=70%`)
- Frontend lint
- Frontend typecheck
- Frontend E2E
- Frontend performance budget

Run the same checks locally before opening or updating a PR:

```bash
cd backend && python3 -m pytest -q --cov=app --cov-report=term-missing --cov-fail-under=70
cd frontend && npm run test:coverage
cd frontend && npm run lint && npm run typecheck
cd frontend && npm run test:e2e
```

## Security Review Artifacts

- Latest security review report: `_bmad-output/implementation-artifacts/security-review-2026-03-10.md`
- Story traceability: `_bmad-output/implementation-artifacts/5-6-security-review-and-remediation-evidence.md`

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

### Compose (root `.env`)

- `COMPOSE_PROFILES` (optional; examples: `dev`, `test`, `dev,test`)
- `FRONTEND_PORT` (default: `8080`)
- `BACKEND_PORT` (default: `8000`)
- `POSTGRES_DB` (default: `todo`)
- `POSTGRES_USER` (default: `todo`)
- `POSTGRES_PASSWORD` (default: `todo`)
- `DATABASE_URL` (optional override; defaults to a value derived from `POSTGRES_*`)
- `CORS_ALLOW_ORIGINS` (default compose CORS for frontend container origins)
- `VITE_API_BASE_URL` (default: `/api`)

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
- If `docker compose --profile ... up` appears stuck:
  - run `docker compose ps` and wait for health checks to become `healthy`
  - inspect logs with `docker compose logs backend frontend db`
- If profile config values are unexpected:
  - run `docker compose --profile dev config` (or `test`) and verify resolved env/ports

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
