# Story 1.2: Create Task API and Request Validation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an end user,
I want to create a task with short text,
so that I can capture work immediately.

## Acceptance Criteria

1. Given a valid short task description, when the client sends a create request, then the API persists the task and returns it in the standardized success envelope, and the response includes required task fields including identifier and creation timestamp.
2. Given an invalid create payload (for example empty or malformed description), when the request is submitted, then the API returns a standardized validation error envelope, and no task is persisted.

## Tasks / Subtasks

- [x] Implement todo create endpoint and request/response schemas (AC: 1, 2)
  - [x] Add `POST /todos` route in `backend/app/api/routes/todos.py`
  - [x] Define request schema for create payload in `backend/app/schemas/todo.py`
  - [x] Define envelope schemas for success/error in `backend/app/api/schemas/response.py` and `backend/app/api/schemas/error.py`
  - [x] Register todos router in `backend/app/main.py` without changing existing `/health` and `/ready` behavior
- [x] Implement persistence layer for task creation (AC: 1)
  - [x] Add SQLAlchemy model for `todos` in `backend/app/db/models/todo.py`
  - [x] Add session/base setup in `backend/app/db/base.py` and `backend/app/db/session.py`
  - [x] Add repository create method in `backend/app/repositories/todo_repository.py`
  - [x] Add service create method in `backend/app/services/todo_service.py`
- [x] Add migration and backend configuration for durability path (AC: 1)
  - [x] Introduce Alembic config/bootstrap (`backend/alembic.ini`, `backend/alembic/env.py`) if missing
  - [x] Add first todo table migration under `backend/alembic/versions/`
  - [x] Wire database settings in `backend/app/core/config.py` and add `backend/.env.example`
- [x] Enforce validation and sanitized error handling (AC: 2)
  - [x] Enforce short-text constraints at API boundary with Pydantic validators
  - [x] Add exception-to-envelope mapping in `backend/app/api/error_handlers.py`
  - [x] Ensure validation failures return standardized error envelope and do not leak stack traces
- [x] Add tests for create success and validation failure (AC: 1, 2)
  - [x] Add backend integration tests for `POST /todos` success envelope shape and persisted result
  - [x] Add negative tests for empty/invalid payload returning validation error envelope and unchanged DB state
  - [x] Keep/update existing health/readiness tests as regression coverage

### Review Follow-ups (AI)

- Do not transition story status to `review` until all items tagged `[Gate: Must Before Review]` are completed.
- Ordering: Severity (High → Medium → Low), then Created date (oldest → newest).
- [x] [AI-Review][High][Created: 2026-03-05][Owner: QA][Target: Sprint 1 / 2026-03-12][Gate: Must Before Review] Expand invalid payload coverage beyond whitespace-only input to include malformed payload variants promised by task scope [backend/tests/test_todo_create.py:95]
- [x] [AI-Review][Medium][Created: 2026-03-05][Owner: Tech Writer][Target: Sprint 1 / 2026-03-12][Gate: Must Before Review] Add missing changed file to story File List for traceability (`sprint-status.yaml`) [_bmad-output/implementation-artifacts/1-2-create-task-api-and-request-validation.md:153]
- [x] [AI-Review][Medium][Created: 2026-03-05][Owner: Dev][Target: Sprint 1 / 2026-03-12][Gate: Must Before Review] Use timezone-aware timestamps for `created_at` in model and migration to strengthen UTC consistency [backend/app/db/models/todo.py:15]
- [x] [AI-Review][Medium][Created: 2026-03-05][Owner: Dev][Target: Sprint 1 / 2026-03-12][Gate: Must Before Review] Align migration `created_at` column with timezone-aware type configuration [backend/alembic/versions/20260305_000001_create_todos_table.py:24]
- [x] [AI-Review][Medium][Created: 2026-03-05][Owner: Dev][Target: Sprint 1 / 2026-03-12][Gate: Must Before Review] Pin `pydantic` explicitly in backend dependencies to avoid transitive dependency drift [backend/requirements.txt:1]
- [x] [AI-Review][Medium][Created: 2026-03-05][Owner: QA][Target: Sprint 1 / 2026-03-12][Gate: Must Before Review] Replace hard-coded integration test ports with dynamic free-port allocation to reduce CI flakiness [backend/tests/test_todo_create.py:42]
- [x] [AI-Review][Low][Created: 2026-03-05][Owner: Dev][Target: Sprint 1 / 2026-03-12][Gate: Must Before Review] Align error code casing with standardized contract style to avoid client normalization drift [backend/app/api/error_handlers.py:20]

## Dev Notes

### Story Context and Scope

- This story introduces backend task creation and validation only; list rendering and quick-add UI are separate stories (`1.3` and `1.4`).
- Keep MVP scope strict: no auth, no advanced fields (priority/tags/due dates), no extra endpoints beyond defined API surface.
- API behavior must be deterministic and envelope-driven from the first todo mutation endpoint.

### Technical Requirements

- API surface for this story: add `POST /todos` while preserving existing `GET /health` and `GET /ready`.
- Success envelope format must be `{ "data": {...} }`.
- Error envelope format must be `{ "error": { "code", "message", "details", "request_id" } }`.
- Status mapping baseline: `201` create success, `400` validation, `500` sanitized server error.
- API/DB field naming: snake_case (`created_at`, `is_completed`); frontend adapter mapping to camelCase happens later.

### Architecture Compliance

- Keep backend boundaries strict:
  - Routes (`backend/app/api/routes/*`) handle HTTP concerns only.
  - Services (`backend/app/services/*`) handle business rules.
  - Repositories (`backend/app/repositories/*`) handle DB access only.
- Pydantic schemas and SQLAlchemy models must remain separated by responsibility.
- Persist before returning success response.

### Library / Framework Requirements

- Backend runtime remains pinned to `fastapi==0.135.1` and `uvicorn[standard]==0.41.0` (already in `backend/requirements.txt`).
- Architecture-selected stack to adopt in this story:
  - SQLAlchemy `2.0.48`
  - Alembic `1.18.4`
  - Pydantic `2.12.5`
- Validation should use Pydantic model-level/field-level constraints and validators; return structured validation details via error envelope.

### File Structure Requirements

- Existing baseline files to preserve:
  - `backend/app/main.py`
  - `backend/app/api/routes/health.py`
  - `backend/app/api/routes/readiness.py`
- New story files should align with architecture structure:
  - `backend/app/api/routes/todos.py`
  - `backend/app/api/schemas/response.py`
  - `backend/app/api/schemas/error.py`
  - `backend/app/schemas/todo.py`
  - `backend/app/db/models/todo.py`
  - `backend/app/db/base.py`
  - `backend/app/db/session.py`
  - `backend/app/services/todo_service.py`
  - `backend/app/repositories/todo_repository.py`
  - `backend/alembic/*`

### Testing Requirements

- Add backend integration coverage for create success and validation failure paths.
- Validate envelope shape and status code mapping explicitly.
- Validate non-persistence for invalid payloads.
- Keep existing readiness/health checks passing.

### Previous Story Intelligence (from 1.1)

- Story 1.1 established the initial FastAPI app and route registration pattern via `app.include_router(...)` in `backend/app/main.py`.
- Health and readiness routes are simple and deterministic; follow the same route-module style for todos.
- Baseline tests exist in `backend/tests/test_health_readiness.py`; extend test style rather than introducing a new framework style mid-epic.
- Review outcome from Story 1.1 was approved with low severity; keep implementation minimal and architecture-aligned.

### Git Intelligence Summary

Recent commits indicate the baseline scaffold and review cycle are complete for Story 1.1, including backend bootstrap and documentation alignment. Reuse the established folder conventions and avoid introducing alternate structure or naming patterns in this story.

### Latest Technical Information

- FastAPI request-body guidance confirms Pydantic models as the canonical way to parse and validate JSON payloads for `POST` endpoints.
- Pydantic v2 validator guidance supports field/model validators for reusable constraints and explicit validation messages.
- SQLAlchemy 2.0 docs emphasize typed declarative models and session-based unit-of-work patterns, aligning with repository/service layering.

### Project Structure Notes

- Current backend app structure already contains `api`, `core`, `db`, `repositories`, `schemas`, `services` directories.
- This story should complete the todo backend vertical slice within those folders, not invent alternate package paths.
- No `project-context.md` file was found; planning artifacts and existing implementation artifacts are the authoritative context source.

### References

- Source story definition: `_bmad-output/planning-artifacts/epics.md` (Epic 1, Story 1.2)
- Product requirements: `_bmad-output/planning-artifacts/prd.md`
- Architecture patterns and boundaries: `_bmad-output/planning-artifacts/architecture.md`
- UX feedback/validation principles: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Previous story context: `_bmad-output/implementation-artifacts/1-1-set-up-initial-project-from-starter-template.md`

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- Story created via `/bmad-create-story` flow with target key `1-2-create-task-api-and-request-validation`.
- Sprint status transitioned from `backlog` to `ready-for-dev` for this story.

### Completion Notes List

- Comprehensive story context generated with architecture, UX, previous story, and git intelligence.
- Implemented `POST /todos` with strict layered boundaries (route → service → repository) and standardized success envelope `{ "data": ... }`.
- Added persistence foundation with SQLAlchemy base/session/model and an initial Alembic migration for durable `todos` table creation.
- Added validation and sanitized error envelopes with `400` request validation mapping and `500` internal error mapping including `request_id`.
- Added backend integration tests for create success and validation failure non-persistence scenarios.
- Executed backend regression and new tests via `python3 -m unittest discover -s tests -p 'test_*.py'` with all tests passing.
- Closed all `[Gate: Must Before Review]` follow-ups: expanded invalid payload variants, switched tests to dynamic ports, aligned `created_at` timezone configuration in model/migration, pinned `pydantic`, normalized error code casing, and updated story file list traceability.
- Completed automatic AI review remediations: switched integration setup to Alembic migration path, made health/readiness tests use dynamic ports, added server-side exception logging, and added ignore rules for runtime artifacts.

### File List

- _bmad-output/implementation-artifacts/1-2-create-task-api-and-request-validation.md
- .gitignore
- backend/.env.example
- backend/alembic.ini
- backend/alembic/env.py
- backend/alembic/script.py.mako
- backend/alembic/versions/20260305_000001_create_todos_table.py
- backend/app/api/error_handlers.py
- backend/app/api/routes/todos.py
- backend/app/api/schemas/__init__.py
- backend/app/api/schemas/error.py
- backend/app/api/schemas/response.py
- backend/app/core/config.py
- backend/app/db/base.py
- backend/app/db/models/__init__.py
- backend/app/db/models/todo.py
- backend/app/db/session.py
- backend/app/main.py
- backend/app/repositories/todo_repository.py
- backend/app/schemas/todo.py
- backend/app/services/todo_service.py
- backend/requirements.txt
- backend/tests/test_health_readiness.py
- backend/tests/test_todo_create.py
- _bmad-output/implementation-artifacts/sprint-status.yaml

## Change Log

- 2026-03-05: Implemented Story 1.2 backend vertical slice for todo creation (API route, validation, persistence, migration bootstrap, and integration tests) and set story status to `review`.
- 2026-03-05: Code review completed; added `Review Follow-ups (AI)` action items and moved story status to `in-progress` pending follow-up implementation.
- 2026-03-05: Completed and checked off all `[Gate: Must Before Review]` follow-ups; updated story status back to `review`.
- 2026-03-05: Applied automated code review remediations (migration-path test coverage, dynamic health-test ports, exception logging, runtime artifact ignore rules) and set story status to `done`.
