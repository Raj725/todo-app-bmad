# Story 2.3: Edit Task Description In-Context

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an end user,
I want to edit a task description,
so that I can correct typos or clarify intent.

## Acceptance Criteria

1. Given a task item is visible, when the user enters edit mode and submits a valid updated description, then the updated text is shown in the list, and the change is persisted through the update API.
2. Given the updated description is invalid, when the user submits the edit, then the UI shows validation feedback, and the original persisted task content remains unchanged.

## Tasks / Subtasks

- [x] Add in-list edit-mode UX and interaction flow in `TodoList` (AC: 1, 2)
  - [x] Add per-item edit mode state (single active editor at a time unless existing patterns support multiple safely)
  - [x] Render inline edit input with semantic controls (`Save`, `Cancel`) using `<button>` elements
  - [x] Preserve keyboard operability (Enter to save, Escape to cancel)
  - [x] Keep non-edited rows usable; only the affected item controls should be pending/disabled during save
- [x] Add frontend update adapter behavior for description updates (AC: 1, 2)
  - [x] Reuse and extend `frontend/src/features/todos/api/updateTodo.ts` for description payload support (do not create duplicate adapter)
  - [x] Ensure standardized backend error-envelope message extraction is preserved on non-2xx responses
  - [x] Add/extend adapter tests in `frontend/src/features/todos/api/updateTodo.test.ts`
- [x] Add mutation orchestration for description edits with optimistic safety (AC: 1, 2)
  - [x] Extend or add hook behavior in `frontend/src/features/todos/hooks/` to support optimistic description update and rollback on failure
  - [x] Preserve per-item pending tracking via `Set<number>` pattern (align with stories 2.1 and 2.2)
  - [x] Preserve scoped per-item error state and retry affordance
  - [x] Invalidate/refetch authoritative todos query after settle
- [x] Ensure backend update contract validates description updates (AC: 1, 2)
  - [x] Confirm `PATCH /todos/{todo_id}` request schema accepts/validates description updates with existing constraints
  - [x] Ensure invalid description returns standardized validation error envelope with no persistence change
  - [x] Ensure not-found behavior remains standardized (`TodoNotFoundError` path)
- [x] Wire app-level integration and tests (AC: 1, 2)
  - [x] Wire edit handlers/props in `frontend/src/app/App.tsx`
  - [x] Add/extend UI tests for inline edit save/cancel/validation/error-retry flows
  - [x] Add/extend backend tests for successful description patch and invalid payload behavior

## Dev Notes

### Story Context and Scope

- Story 2.3 builds directly on Story 2.1 (toggle) and Story 2.2 (delete) list-interaction patterns.
- Scope is strictly in-list editing; do not add modals, extra pages, or alternate editing surfaces.
- FR coverage: FR7, FR8, FR16, FR26.
- Keep no-auth MVP boundaries and existing API surface discipline.

### Technical Requirements

- Reuse existing update endpoint: `PATCH /todos/{todo_id}`.
- Request/response contracts must keep standardized envelopes:
  - Success: `{ "data": { ...todo } }`
  - Error: `{ "error": { "code", "message", "details", "request_id" } }`
- Enforce description validation rules at API boundary (existing create/update constraints).
- Maintain optimistic lifecycle for edit mutation:
  1. optimistic in-list text update
  2. rollback on failure
  3. scoped error feedback + retry
  4. authoritative query reconciliation

### Architecture Compliance

Backend boundaries:
- Routes in `backend/app/api/routes/`
- Request schemas in `backend/app/schemas/`
- Business logic in `backend/app/services/`
- Persistence in `backend/app/repositories/`

Frontend boundaries:
- Transport/envelope parsing in `frontend/src/features/todos/api/`
- Mutation orchestration in `frontend/src/features/todos/hooks/`
- Rendering and in-row interaction in `frontend/src/features/todos/components/`
- App integration wiring in `frontend/src/app/App.tsx`

Do not introduce duplicate API clients or bypass existing error-normalization patterns.

### Library / Framework Requirements

Use repository-established versions and patterns (no new dependencies needed):
- FastAPI `0.135.1`
- Pydantic `2.12.5`
- SQLAlchemy `2.0.48`
- React `19.2.x`
- TypeScript `5.9.x`
- TanStack Query `5.90.x`
- Vitest + Testing Library for frontend tests
- Pytest for backend tests

### File Structure Requirements

Likely backend touchpoints:
- `backend/app/schemas/todo.py`
- `backend/app/api/routes/todos.py`
- `backend/app/services/todo_service.py`
- `backend/app/repositories/todo_repository.py`
- `backend/tests/test_todo_create.py` and/or update-related backend tests

Likely frontend touchpoints:
- `frontend/src/features/todos/components/TodoList.tsx`
- `frontend/src/features/todos/api/updateTodo.ts`
- `frontend/src/features/todos/api/updateTodo.test.ts`
- `frontend/src/features/todos/hooks/useUpdateTodoMutation.ts` (or dedicated edit mutation hook following existing pattern)
- `frontend/src/features/todos/hooks/useUpdateTodoMutation.test.ts` (or matching test file)
- `frontend/src/app/App.tsx`
- `frontend/src/app/App.test.tsx`

### Testing Requirements

Backend:
- PATCH description success persists updated text and returns standardized success envelope.
- PATCH invalid description returns standardized validation error envelope and does not persist changes.
- PATCH unknown id returns standardized 404 envelope.

Frontend:
- Enter edit mode from row action and save valid description updates visible text.
- Cancel edit restores original text without network mutation.
- Invalid input shows validation feedback and prevents invalid persisted state.
- Failed API update rolls back optimistic text and shows scoped retry.
- Per-item pending behavior remains isolated to affected row.

Regression:
- Existing create/list/toggle/delete tests must remain passing.

### Previous Story Intelligence

From Story 2.2:
- Keep per-item pending tracking with `Set<number>` and avoid whole-list rollback overwrites during concurrent operations.
- Keep lightweight in-row interaction model (no modal-heavy UX for routine actions).
- Keep scoped error + retry localized to affected row.

From Story 2.1:
- Continue reading backend error envelope bodies in adapters to preserve server-provided messages.
- Preserve active-first ordering behavior and existing list rendering patterns.

### Git Intelligence Summary

Recent commits (most recent first):
1. `ed8706e` — fix(e2e): mock PATCH /todos/:id in Playwright smoke test
2. `fbc173b` — feat(story-2.2): resolve review findings and complete delete flow
3. `5bbf361` — feat(story-2.2): delete task with lightweight confirmation
4. `c759aaf` — review(story-2.1): fix M2/M3/L1/L2 findings from code review
5. `034b4cb` — Add Playwright E2E tests and CI artifact support

Apply these established patterns rather than introducing parallel conventions.

### Latest Technical Information

- External web research was not executed in this run.
- Guidance is based on project artifacts and repository-pinned dependency versions.

### Project Structure Notes

- No `project-context.md` file was found via discovery.
- Canonical context sources are planning artifacts under `_bmad-output/planning-artifacts/` and completed implementation artifacts in `_bmad-output/implementation-artifacts/`.

### References

- Story definition: `_bmad-output/planning-artifacts/epics.md` (Epic 2, Story 2.3)
- Architecture guardrails: `_bmad-output/planning-artifacts/architecture.md`
- UX behavior requirements: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Previous story learnings: `_bmad-output/implementation-artifacts/2-2-delete-task-with-lightweight-confirmation.md`
- Previous story learnings: `_bmad-output/implementation-artifacts/2-1-toggle-task-complete-and-incomplete-from-list.md`

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- Auto-selected first backlog story from `sprint-status.yaml`: `2-3-edit-task-description-in-context`.
- Loaded and analyzed `epics.md`, `architecture.md`, `ux-design-specification.md`, Story 2.1, Story 2.2, frontend/backend dependency manifests, and recent git commits.
- Generated comprehensive story context with architecture and implementation guardrails.
- Implementation plan executed: add inline edit UX, extend update adapter and mutation orchestration, expand frontend integration tests, extend backend PATCH schema/service/repository, and validate with full frontend/backend suites.
- Validation evidence: `npm run test`, `npm run lint` (frontend) and `python3 -m pytest -q` (backend) all passing.

### Completion Notes List

- Implemented inline in-list editing with single active editor, Save/Cancel controls, Enter/Escape keyboard behavior, and per-item pending control scope.
- Extended `updateTodo` adapter and update mutation to support description PATCH operations with optimistic update, per-item rollback safety, and scoped retry/error state.
- Added and updated frontend tests covering adapter payloads, mutation hook description rollback/retry, and app-level edit save/cancel/validation/error-retry flows.
- Extended backend PATCH contract to accept `description` and/or `is_completed`, including validation for non-empty trimmed description and at-least-one-field updates.
- Added backend integration coverage for successful description PATCH, invalid description validation envelope behavior, and no-persistence-change guarantee on invalid update.
- Updated frontend/backend READMEs to document edit behavior and expanded PATCH contract.

### File List

- _bmad-output/implementation-artifacts/2-3-edit-task-description-in-context.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- frontend/src/features/todos/components/TodoList.tsx
- frontend/src/features/todos/api/updateTodo.ts
- frontend/src/features/todos/api/updateTodo.test.ts
- frontend/src/features/todos/hooks/useUpdateTodoMutation.ts
- frontend/src/features/todos/hooks/useUpdateTodoMutation.test.ts
- frontend/src/app/App.tsx
- frontend/src/app/App.test.tsx
- backend/app/schemas/todo.py
- backend/app/repositories/todo_repository.py
- backend/app/services/todo_service.py
- backend/app/api/routes/todos.py
- backend/tests/test_todo_create.py
- frontend/README.md
- backend/README.md

### Change Log

- 2026-03-06: Story created and prepared for implementation handoff.
- 2026-03-06: Implemented Story 2.3 inline edit flow across frontend/backend with optimistic update safety, scoped retry handling, and expanded test coverage.