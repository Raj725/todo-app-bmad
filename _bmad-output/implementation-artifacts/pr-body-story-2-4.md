## Summary
Implements Story 2.4 (`Enforce Actionable Ordering and Status Clarity`), resolves code-review findings, and moves the story to `done` with validation gates passed.

## What changed
- Centralized canonical todo ordering into `frontend/src/features/todos/orderTodos.ts`:
  - active tasks (`isCompleted=false`) before completed tasks,
  - deterministic secondary sort by newest `createdAt` first,
  - stable tie-breaker by descending `id`.
- Updated `TodoList` rendering to use the shared comparator utility so initial/mixed list render always follows the same policy.
- Updated `useUpdateTodoMutation` cache updates to apply the same ordering utility during optimistic and success paths, ensuring immediate auto-reposition after complete/incomplete toggles without manual refresh.
- Fixed rollback behavior on failed toggle mutations to re-apply canonical actionable ordering immediately after restoring prior state.
- Replaced single toggle failure id tracking with per-item toggle failure set tracking to avoid concurrent failure overwrites.
- Updated app/list wiring to consume per-item toggle failure state (`failedToggleTodoIds`) for scoped error visibility.
- Preserved explicit visible status labels (`Active` / `Completed`) in row content and kept existing semantic, non-color-only clarity.
- Added/extended frontend tests for ordering and status behavior:
  - new component-level tests in `frontend/src/features/todos/components/TodoList.test.tsx`,
  - new app-level complete→active reposition coverage in `frontend/src/app/App.test.tsx`,
  - new hook-level optimistic cache reorder coverage in `frontend/src/features/todos/hooks/useUpdateTodoMutation.test.ts`,
  - new hook-level regression coverage for sorted rollback on toggle failure and concurrent toggle-failure tracking.
- Updated tracking artifacts:
  - story file `_bmad-output/implementation-artifacts/2-4-enforce-actionable-ordering-and-status-clarity.md` set to `done`,
  - `_bmad-output/implementation-artifacts/sprint-status.yaml` updated to `done` for story `2-4-enforce-actionable-ordering-and-status-clarity`.

## Validation
- Frontend focused tests:
  - `npm run test -- src/features/todos/components/TodoList.test.tsx src/app/App.test.tsx src/features/todos/hooks/useUpdateTodoMutation.test.ts`
  - Result: pass (`28 passed`)
- Frontend lint:
  - `npm run lint`
  - Result: pass

## Scope
No new dependencies added. Changes are limited to Story 2.4 ordering/status clarity behavior, associated tests, and required story/sprint tracking updates.
