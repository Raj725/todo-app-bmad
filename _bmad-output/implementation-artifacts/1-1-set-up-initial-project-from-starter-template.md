# Story 1.1: Set Up Initial Project from Starter Template

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the React + FastAPI starter initialized with a running baseline,
so that implementation can proceed on a stable, architecture-aligned foundation.

## Acceptance Criteria

1. Given a new repository workspace, when the frontend and backend starter setup commands are executed, then a runnable React TypeScript frontend and FastAPI backend are created in separate service folders, and `/health` and `/ready` endpoints return successful status responses.
2. Given baseline services are running locally, when a user opens the app URL, then the app loads without authentication, and users can access the initial task experience shell.

## Tasks / Subtasks

- [x] Bootstrap frontend with Vite React TypeScript starter (AC: 1)
  - [x] Run `npm create vite@latest frontend -- --template react-ts`
  - [x] Install dependencies and verify frontend dev server starts
  - [x] Commit baseline frontend scaffold files only
- [x] Bootstrap backend with FastAPI baseline (AC: 1)
  - [x] Create Python virtual environment and install `fastapi==0.135.1` and `uvicorn[standard]`
  - [x] Create backend app entrypoint at `backend/app/main.py`
  - [x] Add `GET /health` and `GET /ready` routes with deterministic success responses
  - [x] Verify backend server starts and endpoints return success
- [x] Align repository structure to architecture boundaries (AC: 1)
  - [x] Ensure top-level split remains `frontend/` and `backend/`
  - [x] Create initial backend package structure (`app/api`, `app/core`, `app/db`, `app/schemas`, `app/services`, `app/repositories`)
- [x] Validate no-auth MVP shell is reachable (AC: 2)
  - [x] Confirm frontend app loads with no login gate
  - [x] Confirm baseline task shell route renders from `frontend/src/app/App.tsx`
- [x] Add baseline checks for startup confidence (AC: 1,2)
  - [x] Add minimal backend API test for `/health` and `/ready`
  - [x] Add minimal frontend smoke test for app shell rendering

## Dev Notes

- Selected starter is explicitly Vite React + TypeScript frontend with separate FastAPI backend; this is the required first implementation step.
- Keep public API surface minimal from day one: `GET/POST/PATCH/DELETE /todos`, `GET /health`, `GET /ready` (only health/readiness required in this story).
- Maintain clean split architecture and boundaries; avoid embedding persistence logic in routes.
- No authentication in MVP baseline; do not add auth scaffolding in this story.
- Use architecture-pinned runtime baselines for consistency: FastAPI 0.135.1 + Uvicorn runtime; React + TypeScript via Vite starter.

### Project Structure Notes

- Follow top-level structure: `frontend/` and `backend/`.
- Backend target layout for future stories: `backend/app/api/routes`, `backend/app/core`, `backend/app/db`, `backend/app/schemas`, `backend/app/services`, `backend/app/repositories`.
- Frontend target layout for future stories: `frontend/src/features/todos`, `frontend/src/components/shared`, `frontend/src/lib/api`.
- No conflicts detected: this story establishes the baseline directories and entrypoints expected by architecture.

### References

- [_bmad-output/planning-artifacts/epics.md](../planning-artifacts/epics.md) (Epic 1, Story 1.1)
- [_bmad-output/planning-artifacts/architecture.md](../planning-artifacts/architecture.md#L94-L111) (Selected Starter + initialization commands)
- [_bmad-output/planning-artifacts/architecture.md](../planning-artifacts/architecture.md#L184-L191) (API pattern and runtime)
- [_bmad-output/planning-artifacts/architecture.md](../planning-artifacts/architecture.md#L384-L522) (Project structure and boundaries)
- [_bmad-output/planning-artifacts/prd.md](../planning-artifacts/prd.md#L141-L148) (React SPA + FastAPI architecture)

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- Story generated from sprint kickoff after sprint planning output.
- Frontend bootstrap: `npm create vite@latest frontend -- --template react-ts`
- Frontend checks: `npm test`, `npm run lint`, `npm run build`, `npm run dev -- --host 127.0.0.1 --port 4173`
- Backend checks: `python -m unittest discover -s tests -p "test_*.py"`, `uvicorn app.main:app --host 127.0.0.1 --port 8002`, `curl http://127.0.0.1:8002/health`, `curl http://127.0.0.1:8002/ready`

### Implementation Plan

- Use Vite React+TS scaffold as the canonical frontend baseline, then move app shell rendering target to `frontend/src/app/App.tsx`.
- Build a minimal FastAPI app with route modules for `/health` and `/ready` and include both routers in `backend/app/main.py`.
- Add only baseline directory and package scaffolding needed by the architecture boundaries for future stories.
- Add minimal startup-confidence tests: frontend render smoke test and backend endpoint smoke tests.

### Completion Notes List

- Implemented frontend baseline with Vite React+TypeScript and verified dev startup.
- Implemented FastAPI backend baseline with deterministic `/health` and `/ready` responses.
- Added backend package skeleton matching architecture boundaries for future story layering.
- Added frontend smoke test for app-shell render and backend smoke tests for health/readiness.
- Validated with frontend test/lint/build and backend unit test execution.

### File List

- _bmad-output/implementation-artifacts/1-1-set-up-initial-project-from-starter-template.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- backend/app/__init__.py
- backend/app/api/__init__.py
- backend/app/api/routes/__init__.py
- backend/app/api/routes/health.py
- backend/app/api/routes/readiness.py
- backend/app/core/__init__.py
- backend/app/db/__init__.py
- backend/app/main.py
- backend/app/repositories/__init__.py
- backend/app/schemas/__init__.py
- backend/app/services/__init__.py
- backend/requirements.txt
- backend/tests/test_health_readiness.py
- frontend/package.json
- frontend/package-lock.json
- frontend/src/App.tsx
- frontend/src/app/App.tsx
- frontend/src/app/App.test.tsx
- frontend/src/setupTests.ts
- frontend/tsconfig.app.json
- frontend/vitest.config.ts

## Senior Developer Review (AI)

### Review Summary
- **Reviewer**: GitHub Copilot
- **Date**: 2026-03-05
- **Outcome**: Approve
- **Severity**: Low

### Validation Results
1. **AC Validation**:
   - AC1 (Run setup commands): Validated. Frontend and backend created and runnable.
   - AC2 (Run app): Validated. Frontend loads, backend endpoints respond.
2. **Task Audit**:
   - All tasks Marked [x] are verified as completed.
3. **Code Quality**:
   - Codebase is clean and minimal, adhering to the "init" phase requirements.
   - Project structure aligns with the architectural requirements.
4. **Test Quality**:
   - Frontend smoke test: PASS.
   - Backend smoke tests: PASS.

### Issues Found
- **Minor**: Missing root `.gitignore`. Created one to exclude `frontend/node_modules`, `backend/__pycache__`, `backend/.venv`, `.DS_Store`, and `.env`.

### Recommendations
- Continue with the next story.

## Change Log

- 2026-03-05: Completed Story 1.1 implementation baseline (frontend bootstrap, backend bootstrap, health/readiness endpoints, architecture-aligned folder scaffolding, and smoke tests). Status moved to `review`.
- 2026-03-05: Senior Developer Review - Approved. Added `.gitignore` to root.
