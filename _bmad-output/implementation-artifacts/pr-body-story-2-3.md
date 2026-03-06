## Summary
Implements Story 2.3 (`Edit Task Description In-Context`) and moves the story to `review` with full validation gates passed.

## What changed
- Added inline in-row edit UX in `TodoList` with:
  - single active editor,
  - semantic `Save` / `Cancel` controls,
  - keyboard support (`Enter` to save, `Escape` to cancel),
  - item-scoped pending behavior so non-edited rows remain usable.
- Extended update adapter in `frontend/src/features/todos/api/updateTodo.ts` to support description patch payloads (while preserving existing error-envelope message extraction).
- Extended mutation orchestration in `useUpdateTodoMutation` for optimistic description updates with item-scoped rollback, retry support, and authoritative query invalidation.
- Wired edit behavior in `frontend/src/app/App.tsx` and passed scoped edit failure state to the list.
- Expanded frontend tests:
  - adapter tests in `updateTodo.test.ts`,
  - hook tests in `useUpdateTodoMutation.test.ts`,
  - app integration tests in `App.test.tsx` for edit save/cancel/validation/error-retry flows.
- Extended backend PATCH contract for `/todos/{todo_id}`:
  - `TodoUpdateRequest` now accepts `description` and/or `is_completed` with validation,
  - repository/service/route support partial updates,
  - standardized validation and not-found envelopes preserved.
- Expanded backend integration tests in `backend/tests/test_todo_create.py` for successful description patch and invalid description no-persistence behavior.
- Updated service READMEs (`frontend/README.md`, `backend/README.md`) to reflect new edit and PATCH capabilities.
- Updated tracking artifacts:
  - story file set to `review`,
  - `_bmad-output/implementation-artifacts/sprint-status.yaml` updated to `review` for story `2-3-edit-task-description-in-context`.

## Validation
- Frontend targeted tests:
  - `npm run test -- src/features/todos/api/updateTodo.test.ts src/features/todos/hooks/useUpdateTodoMutation.test.ts src/app/App.test.tsx`
  - Result: pass (`28 passed`)
- Frontend full suite:
  - `npm run test`
  - Result: pass (`45 passed`)
- Frontend lint:
  - `npm run lint`
  - Result: pass
- Backend targeted tests:
  - `python3 -m pytest -q tests/test_todo_create.py`
  - Result: pass (`7 passed, 5 subtests passed`)
- Backend full suite:
  - `python3 -m pytest -q`
  - Result: pass (`15 passed, 5 subtests passed`)

## Scope
No new dependencies were added. Changes are limited to Story 2.3 requirements, tests, and required documentation/tracking updates.
