# Todo App Backend

## Overview

This service provides the backend API for the todo app MVP.
It is built with FastAPI and SQLAlchemy and exposes health, readiness, and todo endpoints.

## Features

- Health and readiness probes
- Create todo endpoint with request validation and error envelope handling
- List todos endpoint with success envelope responses
- Update todo endpoint (`PATCH /todos/{todo_id}`) for completion and/or description changes with not-found + validation envelope handling
- Delete todo endpoint (`DELETE /todos/{todo_id}`) with 204 success and standardized not-found error handling
- Database access through SQLAlchemy session management
- Alembic migration support

## Tech Stack

- Python 3
- FastAPI
- Uvicorn
- SQLAlchemy
- Alembic
- Pydantic
- Pytest

## Project Structure

backend/
- app/
	- api/
	- core/
	- db/
	- repositories/
	- schemas/
	- services/
	- main.py
- alembic/
- tests/
- requirements.txt

## Prerequisites

- Python 3.11+ recommended
- pip

## Installation

Install dependencies:

```bash
python3 -m pip install -r requirements.txt
```

Install with test/dev tools:

```bash
python3 -m pip install -r requirements-dev.txt
```

From repository root:

```bash
cd backend && python3 -m pip install -r requirements.txt
```

## Configuration

The backend reads environment variables from the runtime environment.

- DATABASE_URL
	- Default: sqlite:///./todo.db
	- Example (SQLite): sqlite:///./todo.db
	- Example (PostgreSQL): postgresql+psycopg://user:password@localhost:5432/todo
- CORS_ALLOW_ORIGINS
	- Default: http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173
	- Purpose: allowed browser origins for cross-origin requests to backend API

Bootstrap local env file:

```bash
cp .env.example .env
```

## Database Migrations

Apply latest migrations:

```bash
python3 -m alembic upgrade head
```

From repository root:

```bash
cd backend && python3 -m alembic upgrade head
```

Create a new migration:

```bash
python3 -m alembic revision -m "describe-change"
```

From repository root:

```bash
cd backend && python3 -m alembic revision -m "describe-change"
```

## Running the Service

Start the API locally from the backend directory:

```bash
python3 -m alembic upgrade head && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

From repository root:

```bash
cd backend && python3 -m alembic upgrade head && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

This ensures schema migrations are applied before the API starts serving traffic in local and CI-style runs.

## Docker

Build backend image:

```bash
docker build -t todo-backend ./backend
```

Run backend container directly:

```bash
docker run --rm -p 8000:8000 \
	-e DATABASE_URL=sqlite:///./todo.db \
	-e CORS_ALLOW_ORIGINS=http://localhost:8080,http://127.0.0.1:8080 \
	todo-backend
```

The container runs Alembic migrations on startup and exposes:

- API docs: http://127.0.0.1:8000/docs
- Health: http://127.0.0.1:8000/health
- Readiness: http://127.0.0.1:8000/ready

Interactive API docs:

- http://127.0.0.1:8000/docs
- http://127.0.0.1:8000/redoc

## API Endpoints

- GET /health
- GET /ready
- POST /todos
- GET /todos
- PATCH /todos/{todo_id}
- DELETE /todos/{todo_id}

## CORS

- The backend enables CORS for local frontend dev origins by default:
	- http://localhost:5173
	- http://127.0.0.1:5173
	- http://localhost:4173
	- http://127.0.0.1:4173
- Override via `CORS_ALLOW_ORIGINS` (comma-separated list) for custom environments.

Response pattern:

- Success envelope: { "data": ... }
- Error envelope: { "error": { "code": ..., "message": ..., "details": ..., "request_id": ... } }

## Testing

Run all backend tests:

```bash
python3 -m pytest -q
```

Run backend tests with CI coverage gate (`>=70%`):

```bash
python3 -m pytest -q --cov=app --cov-report=term-missing --cov-fail-under=70
```

From repository root:

```bash
cd backend && python3 -m pytest -q
```

From repository root with coverage gate:

```bash
cd backend && python3 -m pytest -q --cov=app --cov-report=term-missing --cov-fail-under=70
```

Run individual test modules:

```bash
python3 tests/test_health_readiness.py
python3 tests/test_todo_create.py
```

From repository root:

```bash
cd backend && python3 tests/test_health_readiness.py && python3 tests/test_todo_create.py
```

## CI (Pull Requests)

PR checks are configured in `.github/workflows/tests.yml`.

Backend-related check:

- Backend tests with coverage gate: `python3 -m pytest -q --cov=app --cov-report=term-missing --cov-fail-under=70`
- Backend contract/behavior regression gate: same command as above

Run it locally before opening or updating a PR:

```bash
python3 -m pytest -q --cov=app --cov-report=term-missing --cov-fail-under=70
```

## Troubleshooting

- If browser shows CORS policy errors from frontend origin `http://localhost:5173`:
	- ensure backend is running with current code and environment
	- verify `CORS_ALLOW_ORIGINS` includes the frontend origin
	- restart backend after changing environment variables
- If pytest is missing, install dependencies again:
	- python3 -m pip install -r requirements.txt
- If `/ready` tests fail, verify database connectivity and `DATABASE_URL` value for the test runtime.
- If port 8000 is busy, use another port:
	- uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
- If database schema is out of date, rerun migrations:
	- python3 -m alembic upgrade head

## Notes

- For local development, SQLite default is sufficient.
- For production-like environments, use PostgreSQL via DATABASE_URL.
