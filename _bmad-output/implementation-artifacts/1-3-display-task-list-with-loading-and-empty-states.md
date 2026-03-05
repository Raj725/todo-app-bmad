# Story 1.3: Display Task List with Loading and Empty States

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an end user,
I want to see my tasks immediately when opening the app,
so that I can understand what needs attention.

## Acceptance Criteria

1. Given the app is opened, when task data is being fetched, then a clear loading state is shown, and the interface remains responsive.
2. Given no tasks exist, when task list retrieval completes, then an explicit empty state is shown, and the user can still access the quick-add control.
3. Given tasks exist, when task list retrieval completes, then the list is rendered in the primary view, and task items display their essential details including creation timestamp.

## Tasks / Subtasks

- [x] Add backend task-list read capability with standardized envelope (AC: 2, 3)
  - [x] Add `GET /todos` in `backend/app/api/routes/todos.py` returning `SuccessResponse[list[TodoResponse]]`
  - [x] Add repository list method in `backend/app/repositories/todo_repository.py` with deterministic default ordering for current scope
  - [x] Add service list method in `backend/app/services/todo_service.py` to preserve route/service/repository boundaries
  - [x] Keep error handling through global handlers in `backend/app/api/error_handlers.py` (no ad hoc response shape)
- [x] Add frontend API boundary and types for list retrieval (AC: 2, 3)
  - [x] Add todo list API client under `frontend/src/features/todos/api/` (or project-consistent equivalent if not present yet)
  - [x] Add mapper/types to convert API snake_case (`created_at`, `is_completed`) to frontend camelCase (`createdAt`, `isCompleted`)
  - [x] Ensure list fetch path consumes `{ "data": [...] }` envelope only
- [x] Implement task-list UI states in primary view (AC: 1, 2, 3)
  - [x] Replace shell-only app markup in `frontend/src/app/App.tsx` with list screen composition
  - [x] Add explicit loading state component/content in `frontend/src/features/todos/components/`
  - [x] Add explicit empty state component/content that keeps quick-add visible
  - [x] Add list rendering component for existing tasks with created-at display
- [x] Add query integration and state handling (AC: 1, 2, 3)
  - [x] Install and wire `@tanstack/react-query` with `QueryClientProvider` in `frontend/src/main.tsx` (or app provider module)
  - [x] Add `useTodosQuery` hook that exposes pending/error/data state for the list screen
  - [x] Keep loading UI list-scoped (no full-page blocking spinner)
- [x] Add tests for list API and UI states (AC: 1, 2, 3)
  - [x] Backend tests for `GET /todos` envelope shape and empty/non-empty cases
  - [x] Frontend component tests for loading, empty, and populated render states
  - [x] Verify created timestamp is rendered in populated state and formatting is deterministic

## Dev Notes

### Story Context and Scope

- This story introduces list retrieval and list-state rendering only.
- Do not implement quick-add mutation behavior in this story (that belongs to Story 1.4), but keep quick-add control visible in empty state as required by AC.
- Keep no-auth MVP scope and strict API surface discipline.

### Technical Requirements

- API must provide `GET /todos` under existing todos router and return standardized success envelope: `{ "data": [ ... ] }`.
- Preserve response field naming at API boundary as snake_case and map to camelCase at frontend adapter boundary.
- Loading state must be explicit while fetch is in progress.
- Empty state must be explicit when data fetch resolves with zero tasks.
- Populated state must show essential task details including creation timestamp.
- Avoid global blocking UI for list load; keep interface responsive.

### Architecture Compliance

- Backend boundaries remain strict:
  - Routes in `backend/app/api/routes/*` handle transport only.
  - Services in `backend/app/services/*` orchestrate domain operations.
  - Repositories in `backend/app/repositories/*` own persistence access.
- Frontend boundaries:
  - Todo-specific behavior lives under `frontend/src/features/todos/*`.
  - API transport/envelope parsing stays in a dedicated API/client layer.
  - UI components remain presentation-focused and testable.

### Library / Framework Requirements

- Continue backend stack versions already used in repo:
  - FastAPI `0.135.1`
  - SQLAlchemy `2.0.48`
  - Pydantic `2.12.5`
- Frontend uses React `19.x` and TypeScript `5.9.x`.
- Add and use TanStack Query v5 (`@tanstack/react-query`) for server-state fetching patterns rather than manual ad hoc fetch-effect wiring.

### File Structure Requirements

- Existing files to update:
  - `backend/app/api/routes/todos.py`
  - `backend/app/services/todo_service.py`
  - `backend/app/repositories/todo_repository.py`
  - `frontend/src/main.tsx`
  - `frontend/src/app/App.tsx`
- New files expected (project-consistent naming):
  - `frontend/src/features/todos/api/*`
  - `frontend/src/features/todos/hooks/*`
  - `frontend/src/features/todos/components/*`
  - Optional shared util for date formatting if required by UI determinism
- Keep folders aligned with architecture feature-first frontend and layered backend conventions.

### Testing Requirements

- Backend: extend tests to cover `GET /todos` empty and non-empty responses in standard envelope format.
- Frontend: add tests for three visible states (loading, empty, populated).
- Verify quick-add visibility in empty state even before quick-add mutation is implemented.
- Keep existing Story 1.1 and 1.2 tests passing.

### Previous Story Intelligence (from 1.2)

- Story 1.2 established the todos vertical slice and envelope conventions; reuse those patterns and do not introduce alternate response formats.
- Existing request validation and error envelope handlers are centralized; keep list retrieval compatible with those conventions.
- Current backend structure and test harness (including dynamic test ports and Alembic-based test DB setup) are stable patterns to continue.
- Story 1.2 closed with mandatory review follow-ups completed; preserve timezone-aware `created_at` handling and existing naming conventions.

### Git Intelligence Summary

- Recent commits show Story 1.2 completion and prior story review hardening.
- Follow the established incremental pattern: story artifact creation, focused implementation, then review.
- Avoid broad refactors during this story; keep change set centered on list retrieval and rendering states.

### Latest Technical Information

- FastAPI guidance confirms status/response model metadata on path operations should remain explicit and reflected in OpenAPI.
- TanStack Query v5 guidance supports list fetching via `useQuery` with `isPending`/error/data state split, aligning with required loading and empty-state UX.
- React guidance recommends avoiding unnecessary ad hoc effects for data synchronization when a dedicated server-state library is used.

### Project Structure Notes

- Current frontend is still near starter shape (`frontend/src/app/App.tsx` shell UI), so this story is the first substantial todo UI composition step.
- No `project-context.md` file exists in workspace; authoritative context remains planning artifacts and prior implementation artifacts.

### References

- Epic and story definition: `_bmad-output/planning-artifacts/epics.md` (Epic 1, Story 1.3)
- Architecture boundaries and patterns: `_bmad-output/planning-artifacts/architecture.md`
- UX list-state expectations: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Previous implementation guidance and learnings: `_bmad-output/implementation-artifacts/1-2-create-task-api-and-request-validation.md`

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- Story created via `/bmad:bmm:workflows:create-story` workflow.
- Target selected from first backlog story in sprint status: `1-3-display-task-list-with-loading-and-empty-states`.
- Implemented backend list retrieval route/service/repository path and validated success envelope responses.
- Implemented frontend todo list API adapter, React Query hook/provider wiring, and loading/empty/populated UI states.
- Validation runs completed: `python3 -m unittest discover -s tests`, `npm run test`, and `npm run lint`.

### Completion Notes List

- Added `GET /todos` returning `{"data": [...]}` with deterministic ordering by newest created item first.
- Added frontend API boundary mapping snake_case API fields to camelCase UI fields.
- Replaced shell app with task-list screen showing explicit loading, empty (with quick-add), and populated states.
- Added deterministic created timestamp rendering in populated state via ISO formatting.
- Added backend and frontend tests for empty/non-empty API responses and list state rendering.

### File List

- backend/app/api/routes/todos.py
- backend/app/repositories/todo_repository.py
- backend/app/services/todo_service.py
- backend/tests/test_todo_create.py
- frontend/package-lock.json
- frontend/package.json
- frontend/src/app/App.test.tsx
- frontend/src/app/App.tsx
- frontend/src/features/todos/api/listTodos.ts
- frontend/src/features/todos/api/listTodos.test.ts
- frontend/src/features/todos/components/TodoList.tsx
- frontend/src/features/todos/components/TodoListEmptyState.tsx
- frontend/src/features/todos/components/TodoListLoadingState.tsx
- frontend/src/features/todos/hooks/useTodosQuery.ts
- frontend/src/features/todos/types.ts
- frontend/src/main.tsx
- _bmad-output/implementation-artifacts/1-3-display-task-list-with-loading-and-empty-states.md

## Change Log

- 2026-03-05: Story created and status set to `ready-for-dev` with full implementation context and guardrails.
- 2026-03-05: Implemented Story 1.3 list retrieval and UI list states; added backend and frontend tests; status updated to `review`.
- 2026-03-05: Senior Developer Review (AI) completed, medium issues fixed, and status updated to `done`.

## Senior Developer Review (AI)

### Outcome

- Approved after fixes.

### Findings and Fixes

- [MEDIUM] Staged Python cache binaries (`__pycache__` / `.pyc`) were tracked in git and appeared in the review diff despite being non-source artifacts; removed from source control index.
- [MEDIUM] `frontend/src/features/todos/api/listTodos.ts` trusted JSON shape via type assertion and could fail with unhelpful runtime errors on malformed envelopes; added explicit runtime envelope validation and descriptive error.
- [MEDIUM] `frontend/src/features/todos/components/TodoList.tsx` called `toISOString()` directly on parsed dates and could crash rendering when `createdAt` is malformed; added safe formatting fallback.
- [MEDIUM] No focused tests covered envelope validation behavior; added `frontend/src/features/todos/api/listTodos.test.ts` for valid mapping and malformed envelope rejection.

### AC Re-Validation Summary

- AC1: Implemented (`TodoListLoadingState` rendered while query is pending).
- AC2: Implemented (empty state explicit and quick-add control visible).
- AC3: Implemented (populated list renders with creation timestamp).