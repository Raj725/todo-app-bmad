# Todo App Backend

## Overview

This service provides the backend API for the todo app MVP.
It is built with FastAPI and SQLAlchemy and exposes health, readiness, and todo endpoints.

## Features

- Health and readiness probes
- Create todo endpoint with request validation and error envelope handling
- List todos endpoint with success envelope responses
- Update todo completion endpoint (`PATCH /todos/{todo_id}`) with not-found + validation envelope handling
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
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

From repository root:

```bash
cd backend && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Interactive API docs:

- http://127.0.0.1:8000/docs
- http://127.0.0.1:8000/redoc

## API Endpoints

- GET /health
- GET /ready
- POST /todos
- GET /todos
- PATCH /todos/{todo_id}

Response pattern:

- Success envelope: { "data": ... }
- Error envelope: { "error": { "code": ..., "message": ..., "details": ..., "request_id": ... } }

## Testing

Run all backend tests:

```bash
python3 -m pytest -q
```

From repository root:

```bash
cd backend && python3 -m pytest -q
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

- Backend tests: `python3 -m pytest -q`

Run it locally before opening or updating a PR:

```bash
python3 -m pytest -q
```

## Troubleshooting

- If pytest is missing, install dependencies again:
	- python3 -m pip install -r requirements.txt
- If port 8000 is busy, use another port:
	- uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
- If database schema is out of date, rerun migrations:
	- python3 -m alembic upgrade head

## Notes

- For local development, SQLite default is sufficient.
- For production-like environments, use PostgreSQL via DATABASE_URL.
