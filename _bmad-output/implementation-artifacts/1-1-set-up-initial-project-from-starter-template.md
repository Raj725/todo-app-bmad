# Story 1.1: Set Up Initial Project from Starter Template

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the React + FastAPI starter initialized with a running baseline,
so that implementation can proceed on a stable, architecture-aligned foundation.

## Acceptance Criteria

1. Given a new repository workspace, when the frontend and backend starter setup commands are executed, then a runnable React TypeScript frontend and FastAPI backend are created in separate service folders, and `/health` and `/ready` endpoints return successful status responses.
2. Given baseline services are running locally, when a user opens the app URL, then the app loads without authentication, and users can access the initial task experience shell.

## Tasks / Subtasks

- [ ] Bootstrap frontend with Vite React TypeScript starter (AC: 1)
  - [ ] Run `npm create vite@latest frontend -- --template react-ts`
  - [ ] Install dependencies and verify frontend dev server starts
  - [ ] Commit baseline frontend scaffold files only
- [ ] Bootstrap backend with FastAPI baseline (AC: 1)
  - [ ] Create Python virtual environment and install `fastapi==0.135.1` and `uvicorn[standard]`
  - [ ] Create backend app entrypoint at `backend/app/main.py`
  - [ ] Add `GET /health` and `GET /ready` routes with deterministic success responses
  - [ ] Verify backend server starts and endpoints return success
- [ ] Align repository structure to architecture boundaries (AC: 1)
  - [ ] Ensure top-level split remains `frontend/` and `backend/`
  - [ ] Create initial backend package structure (`app/api`, `app/core`, `app/db`, `app/schemas`, `app/services`, `app/repositories`)
- [ ] Validate no-auth MVP shell is reachable (AC: 2)
  - [ ] Confirm frontend app loads with no login gate
  - [ ] Confirm baseline task shell route renders from `frontend/src/app/App.tsx`
- [ ] Add baseline checks for startup confidence (AC: 1,2)
  - [ ] Add minimal backend API test for `/health` and `/ready`
  - [ ] Add minimal frontend smoke test for app shell rendering

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

### Completion Notes List

- Story context prepared for implementation handoff.

### File List

- _bmad-output/implementation-artifacts/1-1-set-up-initial-project-from-starter-template.md
