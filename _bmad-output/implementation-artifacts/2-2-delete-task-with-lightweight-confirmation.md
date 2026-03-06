# Story 2.2: Delete Task with Lightweight Confirmation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an end user,
I want to delete tasks I no longer need,
so that my list stays relevant and uncluttered.

## Acceptance Criteria

1. Given a task is displayed in the list, when the user initiates delete and confirms the lightweight prompt, then the task is removed from the list and persisted backend state, and visible feedback confirms the outcome.
2. Given delete fails at the API layer, when failure is returned, then the task remains visible in a consistent state, and the UI presents a clear retry option.

## Tasks / Subtasks

- [x] Add backend delete capability through existing API boundaries (AC: 1, 2)
  - [x] Add `DELETE /todos/{todo_id}` route in `backend/app/api/routes/todos.py` returning HTTP 204 No Content on success
  - [x] Add `delete_todo` method to `TodoService` that raises `TodoNotFoundError` if the record does not exist (reuse the existing error class)
  - [x] Add `delete` method to `TodoRepository` that removes the row; return `True` if deleted, `None` if not found
  - [x] No new request or response schema is needed (204 carries no body)
- [x] Add frontend delete adapter and mutation hook for in-list deletion (AC: 1, 2)
  - [x] Add `deleteTodo.ts` in `frontend/src/features/todos/api/` with a `DELETE /todos/{todoId}` call; treat 204 as success; read standardized error envelope body on non-2xx to surface server error message (consistent with `updateTodo.ts` pattern)
  - [x] Add `deleteTodo.test.ts` in `frontend/src/features/todos/api/`
  - [x] Add `useDeleteTodoMutation.ts` in `frontend/src/features/todos/hooks/` with: optimistic removal from TanStack Query cache, rollback on failure by restoring original list, scoped per-item pending tracking via `Set<number>`, scoped per-item error tracking, and authoritative refetch on success
  - [x] Add `useDeleteTodoMutation.test.ts` in `frontend/src/features/todos/hooks/`
- [x] Implement in-list delete control with lightweight confirmation (AC: 1, 2)
  - [x] Update `TodoList.tsx` to add a delete button per item; on first click enter a per-item "confirm pending" state showing inline "Confirm?" / "Cancel" controls — no modal, no navigation, no global UI lock
  - [x] Show per-item loading state during in-flight delete (disable controls for that item); use `pendingDeleteIds: Set<number>` pattern consistent with `pendingTodoIds`
  - [x] Show scoped error with retry affordance on failed delete (consistent with existing toggle error pattern)
  - [x] Ensure delete controls are keyboard-operable and use semantic `<button>` elements
- [x] Update App.tsx wiring (AC: 1, 2)
  - [x] Wire `onDeleteTodo` handler from `useDeleteTodoMutation` into `TodoList`; thread `pendingDeleteIds` and `failedDeleteTodoId` props
- [x] Add/extend tests for delete paths (AC: 1, 2)
  - [x] Backend tests: `DELETE /todos/{todo_id}` success (204), not-found 404 error envelope
  - [x] Frontend tests: delete success removes item, rollback on failure, scoped error feedback, confirm/cancel flow, concurrent pending IDs via Set

### Review Follow-ups (AI)

- [x] [AI-Review][High] Add UI-level test coverage for delete confirm/cancel/retry interaction in list rendering flow; current app-level suite contains no delete interaction assertions. [frontend/src/app/App.test.tsx:1]
- [x] [AI-Review][High] Prevent stale rollback overwrite during concurrent deletes by rolling back only the failed item (or by merge-safe reconciliation) instead of restoring whole `previousTodos` snapshot. [frontend/src/features/todos/hooks/useDeleteTodoMutation.ts:1]
- [x] [AI-Review][Medium] Fix repository return type contract for `delete` to reflect `None` on not-found (`bool | None`), matching implementation and docstring. [backend/app/repositories/todo_repository.py:32]
- [x] [AI-Review][Medium] Update backend service README endpoint documentation to include delete capability (`DELETE /todos/{todo_id}`). [backend/README.md:1]
- [x] [AI-Review][Medium] Update frontend API integration README section to include `DELETE /todos/{todo_id}` usage. [frontend/README.md:1]
- [x] [AI-Review][Medium] Document review context when working tree is clean (implementation reviewed from commit `5bbf361` because working tree was clean at review start). [_bmad-output/implementation-artifacts/2-2-delete-task-with-lightweight-confirmation.md:1]

## Dev Notes

### Story Context and Scope

- This story adds delete semantics to the in-list task management surface established by Stories 2.1 (toggle) and 1.x (create/list).
- Scope is strictly in-list; no dedicated delete page, no modal dialog component, no navigation changes.
- No-auth MVP constraints remain in force.
- FR5: delete a task. FR8: action directly from list. FR16: explicit success/failure outcome. FR17: retry on failure. FR27: system provides deletion API capability.

### Technical Requirements

- API endpoint: `DELETE /todos/{todo_id}`
  - Success → HTTP 204 No Content (no response body)
  - Not found → HTTP 404 standardized error envelope (handled by existing `todo_not_found_exception_handler`)
  - No request body required
- Maintain standardized API response envelopes for errors:
  - error: `{ "error": { "code", "message", "details", "request_id" } }`
- Frontend delete mutation lifecycle (mirror toggle pattern):
  1. Optimistic remove from TanStack Query cache
  2. Rollback (restore item to cache) on failure
  3. Scoped per-item error feedback
  4. Authoritative query refetch on success

### Architecture Compliance

Keep backend layer boundaries intact:
- Routes: `backend/app/api/routes/todos.py`
- Business logic: `backend/app/services/todo_service.py`
- Persistence: `backend/app/repositories/todo_repository.py`
- Error handling: `app.api.error_handlers.todo_not_found_exception_handler` already handles `TodoNotFoundError` → 404; do NOT add a new handler

Keep frontend layer boundaries intact:
- Transport/envelope parsing: `frontend/src/features/todos/api/`
- Mutation orchestration: `frontend/src/features/todos/hooks/`
- Rendering/interaction: `frontend/src/features/todos/components/`
- App wiring: `frontend/src/app/App.tsx`

Do NOT bypass shared error handling patterns already established in the backend.

### Library / Framework Requirements

Use project-established stack and versions exactly as already present — no new dependencies required:
- FastAPI `0.135.1`
- Pydantic `2.12.5` (no new schema needed for 204)
- SQLAlchemy 2.x (already in use)
- React `19.2.x`
- TypeScript `5.9.x`
- TanStack Query `5.90.x` (use `queryClient.setQueryData` for optimistic cache mutation, `queryClient.invalidateQueries` for authoritative refetch)
- Vitest + Testing Library for frontend unit tests (existing setup)

### File Structure Requirements

Expected backend files to update:
- `backend/app/api/routes/todos.py` — add `DELETE /todos/{todo_id}` route
- `backend/app/services/todo_service.py` — add `delete_todo` method
- `backend/app/repositories/todo_repository.py` — add `delete` method
- `backend/tests/` — add/extend tests for delete endpoint

Expected frontend files to add/update:
- `frontend/src/features/todos/api/deleteTodo.ts` (new)
- `frontend/src/features/todos/api/deleteTodo.test.ts` (new)
- `frontend/src/features/todos/hooks/useDeleteTodoMutation.ts` (new)
- `frontend/src/features/todos/hooks/useDeleteTodoMutation.test.ts` (new)
- `frontend/src/features/todos/components/TodoList.tsx` (update — add delete button, confirm state, pending/error props)
- `frontend/src/app/App.tsx` (update — wire delete handler and props)
- Related frontend component tests (update `App.test.tsx` if App props change)

### Testing Requirements

Backend:
- `DELETE /todos/{todo_id}` with existing id → 204 No Content, item removed from subsequent `GET /todos`
- `DELETE /todos/{todo_id}` with non-existent id → 404 standardized error envelope `{ "error": { "code": "NOT_FOUND", ... } }`

Frontend:
- `deleteTodo` adapter: success path returns without error; non-2xx path throws with server error message from error envelope (consistent with `updateTodo.ts` pattern)
- `useDeleteTodoMutation`: initial state (empty pending set, null error); optimistic removal; rollback on failure; concurrent pending IDs tracked in `Set<number>`; failure then recovery clears error
- `TodoList` rendering: delete button renders per item; confirm state visible on first click; cancel returns to normal; confirm in-flight disables controls for that item; error feedback with retry renders on failure

Regression:
- All existing create/list/toggle tests must continue to pass unchanged.

### Previous Story Intelligence (from Story 2.1)

- **`pendingTodoIds: Set<number>` pattern**: Story 2.1's code review (M3) upgraded pending tracking from `number | null` to `Set<number>` to handle concurrent in-flight mutations correctly. Apply the same `Set<number>` pattern for `pendingDeleteIds` from the start — do NOT use `number | null`.
- **Error envelope reading in adapter**: Story 2.1's code review (M2) required `updateTodo.ts` to read the standardized error envelope body and surface the server error message. `deleteTodo.ts` must do the same — do NOT throw a generic error string.
- **`formatCreatedAt` simplification (L1)**: The util now returns the original server-sent string directly. No re-serialization.
- **Scoped error pattern**: `failedTodoId: number | null` is tracked per-item for toggle failures in `TodoList`; add an analogous `failedDeleteTodoId: number | null` prop (or merge into a single error-tracking approach if cleaner).
- **Separate pending sets**: Toggle (`pendingTodoIds`) and delete (`pendingDeleteIds`) track different in-flight operations; keep them separate to avoid disabling a toggle while a delete is in flight on the same item, and vice versa. Consider disabling BOTH toggle and delete buttons for any item whose id appears in either set.
- **Active-first ordering**: Ordering logic in `sortTodos` is already correct and must be preserved; delete does not change it.
- **`useUpdateTodoMutation` cancels in-flight queries** before applying optimistic update — consider the same defensive step for delete to avoid race conditions.
- **Test coverage target**: Story 2.1 ended with 24 frontend tests passing. Aim to extend coverage; do not regress.

### Git Intelligence Summary

Recent commits (most recent first):
1. `c759aaf` — `review(story-2.1): fix M2/M3/L1/L2 findings from code review` — establishes the Set-based pending tracking, improved error envelope reading, and hook-level tests.
2. `034b4cb` — `Add Playwright E2E tests and CI artifact support`
3. `32465f2` — update `useUpdateTodoMutation.ts`
4. `cb15ccb` — update `backend/app/main.py`
5. `b54df34` — `feat(story-2.1): add todo completion toggle flow`

The post-review patterns in commit `c759aaf` represent the authoritative implementation standard for this story.

### Latest Technical Information

- No external web research was executed in this run. Guidance is based on current project architecture artifacts and repository-established versions/patterns.
- Framework and library versions are confirmed from `backend/requirements.txt`, `frontend/package.json`, and prior story artifacts. No dependency upgrades are required or expected for this story.

### Project Structure Notes

- No `project-context.md` file was found in the repository.
- Planning artifacts under `_bmad-output/planning-artifacts/` remain the canonical context source.
- The existing `todo_not_found_exception_handler` and `TodoNotFoundError` in `backend/app/api/error_handlers.py` and `backend/app/services/todo_service.py` are fully reusable for the 404 delete-not-found path — do NOT add a separate error class or handler.

### References

- Story definition: [_bmad-output/planning-artifacts/epics.md](_bmad-output/planning-artifacts/epics.md) (Epic 2, Story 2.2)
- Product constraints and NFRs: [_bmad-output/planning-artifacts/prd.md](_bmad-output/planning-artifacts/prd.md)
- Architecture patterns and boundaries: [_bmad-output/planning-artifacts/architecture.md](_bmad-output/planning-artifacts/architecture.md)
- Prior story patterns (code review fixes): [_bmad-output/implementation-artifacts/2-1-toggle-task-complete-and-incomplete-from-list.md](_bmad-output/implementation-artifacts/2-1-toggle-task-complete-and-incomplete-from-list.md)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

- Auto-selected first backlog story from `sprint-status.yaml`: `2-2-delete-task-with-lightweight-confirmation`.
- Loaded and analyzed epics, architecture, UX, sprint status, Story 2.1 (previous story intelligence), and current codebase files.
- generated story context with architecture guardrails, implementation tasks, and Story 2.1 code-review learnings embedded.

### Completion Notes List

- Implemented `DELETE /todos/{todo_id}` route returning HTTP 204 No Content on success; existing `todo_not_found_exception_handler` handles the 404 path via `TodoNotFoundError` — no new error handler added.
- Added `TodoRepository.delete()` returning `True` on deletion, `None` if not found; `TodoService.delete_todo()` raises `TodoNotFoundError` when `None` is returned.
- Frontend `deleteTodo.ts` mirrors `updateTodo.ts` error-envelope reading pattern: reads `error.message` from standardized envelope body on non-2xx; falls back to `"Failed to delete todo"` if body cannot be parsed. 204 resolves as `void`.
- `useDeleteTodoMutation.ts` mirrors `useUpdateTodoMutation.ts`: `Set<number>` for `pendingDeleteIds`, `number | null` for `failedDeleteTodoId`, optimistic removal from TanStack Query cache, rollback on failure, authoritative `invalidateQueries` on settle.
- `TodoList.tsx` extended with per-item confirm state (`confirmDeleteId: number | null`) using inline "Confirm?" / "Cancel" controls — no modal, no navigation, no global lock. Toggles and deletes share a mutual disable guard (`isAnyPending`) so concurrent inflight operations don't cross-enable unexpectedly. Scoped delete error with "Retry" button re-invokes `onDeleteTodo`.
- All controls use semantic `<button>` elements with descriptive `aria-label` attributes.
- Backend: 14/14 tests pass (3 new delete tests added). Frontend: 34/34 tests pass (10 new tests added across adapter, hook, no regressions).
- TypeScript type-check clean. ESLint clean.
- Fixed Playwright E2E smoke test CI failure by broadening route interception in `frontend/tests/e2e/todo-smoke.spec.ts` from `**/todos` to a matcher that also covers `PATCH /todos/{id}`; this prevents unmocked toggle requests from rolling back optimistic UI state in CI.

### File List

backend/app/api/routes/todos.py
backend/app/services/todo_service.py
backend/app/repositories/todo_repository.py
backend/tests/test_todo_delete.py
frontend/src/features/todos/api/deleteTodo.ts
frontend/src/features/todos/api/deleteTodo.test.ts
frontend/src/features/todos/hooks/useDeleteTodoMutation.ts
frontend/src/features/todos/hooks/useDeleteTodoMutation.test.ts
frontend/src/features/todos/components/TodoList.tsx
frontend/src/app/App.tsx
frontend/tests/e2e/todo-smoke.spec.ts

### Senior Developer Review (AI)

- Reviewer: Raj
- Date: 2026-03-06
- Outcome: Changes Requested
- Summary:
  - AC 1 is largely implemented end-to-end (delete endpoint, service/repository path, optimistic client mutation, inline confirm UX, retry affordance).
  - AC 2 is partially validated in hook/API tests, but UI-level delete confirmation/retry behavior is not covered in the app/component test layer.
  - Concurrency safety gap identified: concurrent delete rollback restores full snapshot and can transiently reintroduce successfully deleted items until refetch settles.
  - Documentation parity gap identified for both frontend and backend READMEs (missing delete endpoint mention).
  - Story moved to `in-progress` pending follow-up completion.

- Follow-up remediation (2026-03-06):
  - Applied per-item rollback logic in delete mutation to avoid concurrent stale-list restoration.
  - Added app-level tests for delete confirm/cancel and failed-delete retry flows.
  - Updated backend/frontend READMEs to include delete endpoint/API integration parity.
  - Verified with targeted frontend tests, frontend lint, and full backend test suite.
  - Final outcome: Approved after fixes.

### Change Log

- 2026-03-06: feat(story-2.2): implement delete task with lightweight confirmation — added DELETE /todos/{todo_id} API endpoint (204/404), deleteTodo adapter, useDeleteTodoMutation hook with optimistic removal and rollback, per-item inline confirm/cancel UX in TodoList, scoped error with retry, App.tsx wiring (14 backend + 34 frontend tests passing)
- 2026-03-06: Senior Developer Review (AI) completed — 2 High and 4 Medium findings recorded; follow-up tasks added under `Review Follow-ups (AI)`; status moved to `in-progress`.
- 2026-03-06: Applied all review follow-up fixes (high + medium), validated via tests/lint, and moved story to `done`.
- 2026-03-06: Fixed frontend Playwright smoke test route interception to include item-level `PATCH /todos/{id}` calls, resolving CI E2E failure where the post-toggle "as active" button was not found.

```
