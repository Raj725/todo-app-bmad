# Story 4.1: Durable Persistence Across Refresh and Session Return

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an end user,
I want my confirmed task changes to remain after refresh and later visits,
so that I can trust the app for daily use.

## Acceptance Criteria

1. Given task mutations are confirmed successful, when the user refreshes the page or returns in a later session, then previously saved tasks are retrieved from backend persistence, and the displayed state matches persisted data.
2. Given backend service restarts occur, when tasks are requested after restart, then confirmed mutations remain intact, and no durable data loss is observed.

## Tasks / Subtasks

- [x] Ensure backend persistence guarantees survive process restarts for confirmed mutations (AC: 2)
  - [x] Verify SQLAlchemy session/commit flow persists writes durably before returning success in create/update/delete repository operations.
  - [x] Validate Alembic migration baseline and startup behavior for local and CI flows so persisted schema is available before serving requests.
  - [x] Confirm configuration supports file-backed SQLite for dev/test persistence continuity and explicit PostgreSQL URL usage for production-like environments.

- [x] Enforce deterministic frontend reload/session rehydration from authoritative backend data (AC: 1)
  - [x] Verify initial load path (`useTodosQuery` + list API adapter) always renders server-returned data after full reload.
  - [x] Ensure no stale optimistic artifacts are shown as persisted after browser refresh.
  - [x] Keep active-first ordering deterministic after rehydrated fetch.

- [x] Add regression tests for refresh/session durability and restart continuity (AC: 1, 2)
  - [x] Add backend persistence regression tests to verify confirmed mutations remain available after app restart simulation/reinitialization.
  - [x] Add/extend frontend E2E scenario that performs mutations, reloads the page, and validates persisted truth.
  - [x] Ensure test assertions explicitly distinguish persisted success from optimistic transient state.

- [x] Preserve existing reliability and UX guardrails while implementing persistence hardening (AC: 1, 2)
  - [x] Keep standardized success/error envelopes unchanged.
  - [x] Keep mutation failure rollback and retry behavior scoped per item/action.
  - [x] Avoid introducing new user-facing feature surfaces beyond persistence behavior in this story.

- [x] Run quality gates (AC: 1, 2)
  - [x] `frontend`: `npm run lint`
  - [x] `frontend`: `npm run test`
  - [x] `frontend`: `npm run test:e2e`
  - [x] `backend`: `python3 -m pytest -q`

## Dev Notes

### Story Context and Scope

- This story starts Epic 4 and focuses on persistence trust: confirmed writes must remain durable across page refresh, session return, and backend restarts.
- Scope is persistence and rehydration behavior only; do not add authentication, filters, tags, due dates, reminders, or other growth features.
- This story should preserve all Epic 3 reliability guarantees (error envelope, deterministic rollback, retry isolation, reconciliation behavior).
- FR coverage: FR20, FR21, FR22. NFR emphasis: NFR4, NFR6.

### Technical Requirements

- Backend must not return mutation success until persistence commit has completed.
- Startup/run flows used by local dev and tests must apply migrations before serving API requests where required.
- Frontend initial data render after reload must derive from `GET /todos` persisted payload (not optimistic cache residue).
- Persistence behavior must remain consistent with current API contract and envelope standards.
- Keep no-auth MVP boundaries intact.

### Architecture Compliance

Primary backend touchpoints:
- `backend/app/repositories/todo_repository.py`
- `backend/app/db/session.py`
- `backend/app/core/config.py`
- `backend/app/api/routes/todos.py`
- `backend/alembic.ini`

Primary frontend touchpoints:
- `frontend/src/features/todos/hooks/useTodosQuery.ts`
- `frontend/src/features/todos/api/listTodos.ts`
- `frontend/src/features/todos/components/TodoList.tsx`
- `frontend/src/features/todos/orderTodos.ts`

Likely test touchpoints:
- `backend/tests/test_todo_create.py`
- `backend/tests/test_todo_delete.py`
- `frontend/tests/e2e/todo-smoke.spec.ts`
- `frontend/src/features/todos/components/TodoList.test.tsx`

### Library / Framework Requirements

- Use existing stack and versions/patterns in this repository:
  - FastAPI + SQLAlchemy + Alembic + Pydantic on backend
  - React + TypeScript + TanStack Query on frontend
  - Pytest, Vitest/Testing Library, and Playwright for validation
- No new framework is required for this story.

### File Structure Requirements

- Keep persistence/domain logic in backend repository/service layers; do not move business logic into route handlers.
- Keep frontend server-state behavior in existing todo hooks and API adapter files.
- Preserve API snake_case at transport boundary and camelCase mapping in frontend domain types.
- Keep changes minimal and targeted to durability/reload concerns.

### Testing Requirements

Backend expectations:
- Confirmed create/update/delete operations remain available after backend process restart simulation.
- Persistence assertions must validate durable state, not just in-memory lifecycle behavior.

Frontend expectations:
- After performing one or more confirmed mutations, a browser reload must show persisted backend truth.
- No stale optimistic placeholder or false-success state appears after reload.

E2E expectations:
- Execute mutation flow, perform reload, and assert task list matches persisted backend state.
- Include at least one failure-path assertion ensuring only confirmed mutations survive.

### Previous Story Intelligence

Carry forward from Story 3.4 (`done`):
- Reuse established mutation lifecycle contract (optimistic apply, rollback on failure, scoped error, authoritative refetch).
- Preserve scoped failure isolation and avoid global loading/error locks.
- Reuse existing adapters and hooks; do not add parallel state systems.

### Git Intelligence Summary

- Story 3.4 and related recent changes hardened reconciliation and E2E reliability; this story should extend those patterns toward durability/restart guarantees.
- Recent work confirms existing testing infrastructure is active and should be reused instead of introducing new test frameworks.

### Latest Technical Information

- External web research was not executed in this run.
- Guidance is based on current project planning artifacts, architecture decisions, and repository implementation patterns.

### Project Structure Notes

- No `project-context.md` file was found in workspace.
- Canonical planning sources for this story are:
  - `_bmad-output/planning-artifacts/epics.md`
  - `_bmad-output/planning-artifacts/prd.md`
  - `_bmad-output/planning-artifacts/architecture.md`
  - `_bmad-output/planning-artifacts/ux-design-specification.md`

### References

- Story definition: `_bmad-output/planning-artifacts/epics.md` (Epic 4, Story 4.1)
- Product requirements: `_bmad-output/planning-artifacts/prd.md` (FR20, FR21, FR22; NFR4, NFR6)
- Architecture guardrails: `_bmad-output/planning-artifacts/architecture.md` (durable persistence, API envelope discipline, reconciliation to backend truth)
- UX behavior constraints: `_bmad-output/planning-artifacts/ux-design-specification.md` (trust-preserving feedback, predictable recovery, one-screen flow)
- Previous story context: `_bmad-output/implementation-artifacts/3-4-reconciliation-to-persisted-backend-truth.md`

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- Loaded BMAD module config from `_bmad/bmm/config.yaml` and resolved workflow variables.
- Loaded workflow engine `_bmad/core/tasks/workflow.xml`.
- Loaded dev-story workflow files (`workflow.yaml`, `instructions.xml`, `checklist.md`) and executed steps in order.
- Parsed `_bmad-output/implementation-artifacts/sprint-status.yaml` fully and selected first `ready-for-dev` story: `4-1-durable-persistence-across-refresh-and-session-return`.
- Created/switched to git branch `feat/4-1-durable-persistence-across-refresh-and-session-return` before code changes.
- Added backend restart durability regression test in `backend/tests/test_persistence_durability.py`.
- Added real-backend reload/session persistence E2E regression in `frontend/tests/e2e/todo-smoke.spec.ts` including failed optimistic create non-persistence assertion.
- Updated backend startup documentation to run Alembic migrations before serving in `backend/README.md`.
- Ran targeted regressions and full quality gates: frontend lint + unit tests + E2E, backend pytest.

### Implementation Plan

- Validate durability of confirmed create/update/delete mutations across backend restarts.
- Validate refresh/session rehydration from authoritative backend truth and exclusion of transient optimistic failures.
- Add and execute backend + E2E regression tests for restart/reload durability.
- Preserve existing API envelopes and scoped retry/rollback behavior while avoiding feature-surface expansion.

### Completion Notes List

- ✅ Added backend durability regression test covering confirmed create/update/delete persistence across process restart simulation.
- ✅ Added real-backend E2E flow proving only confirmed mutations survive browser reload and failed optimistic create artifacts do not persist.
- ✅ Confirmed backend commit-before-success behavior remains enforced via repository session commit flow and restart persistence assertions.
- ✅ Kept standardized success/error envelopes and scoped optimistic rollback/retry behavior unchanged.
- ✅ Updated backend README startup command to apply migrations before serving requests.
- ✅ Executed all required quality gates successfully:
  - `frontend`: `npm run lint`
  - `frontend`: `npm run test`
  - `frontend`: `npm run test:e2e`
  - `backend`: `python3 -m pytest -q`

### File List

- _bmad-output/implementation-artifacts/4-1-durable-persistence-across-refresh-and-session-return.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- backend/tests/test_persistence_durability.py
- frontend/tests/e2e/todo-smoke.spec.ts
- backend/README.md
- frontend/playwright.config.ts

### Change Log

- 2026-03-06: Story created and prepared for implementation handoff (`ready-for-dev`).
- 2026-03-06: Senior Developer Review completed; missing file added to list; status moved to `done`.

## Senior Developer Review (AI)

- **Date:** 2026-03-06
- **Reviewer:** GitHub Copilot
- **Outcome:** Approved with Fixes
- **Notes:**
  - Validated backend durability test (`backend/tests/test_persistence_durability.py`) covering process restarts.
  - Validated frontend E2E specific persistence test (`frontend/tests/e2e/todo-smoke.spec.ts`) distinguishing confirmed vs optimistic state.
  - Identified `frontend/playwright.config.ts` was changed but missing from File List; added automatically.
  - Verified backend commit discipline in `todo_repository.py`.
  - All quality gates passed.
- 2026-03-06: Implemented Story 4.1 durability regressions and startup migration run guidance; status moved to `review`.
