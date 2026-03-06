## Summary
Completes Story 3.1 (`Standardized Error Envelope and Client Error Normalization`) including follow-up fixes from code review, and moves the story to `done`.

## What changed
- Preserved standardized frontend error normalization and wired normalized messages through to scoped UI feedback:
  - `frontend/src/features/todos/hooks/useCreateTodoMutation.ts`
  - `frontend/src/features/todos/hooks/useUpdateTodoMutation.ts`
  - `frontend/src/features/todos/hooks/useDeleteTodoMutation.ts`
  - `frontend/src/features/todos/components/TodoQuickAdd.tsx`
  - `frontend/src/features/todos/components/TodoList.tsx`
  - `frontend/src/app/App.tsx`
- Retained strict success-envelope checks and shared parser usage in mutation adapters:
  - `frontend/src/features/todos/api/createTodo.ts`
  - `frontend/src/features/todos/api/updateTodo.ts`
  - `frontend/src/features/todos/api/deleteTodo.ts`
  - `frontend/src/features/todos/api/normalizeTodoApiError.ts`
- Strengthened backend envelope contract consistency by constructing responses via typed schema:
  - `backend/app/api/error_handlers.py`
- Extended backend mutation envelope integration coverage:
  - `backend/tests/test_api_error_responses.py`
  - Added `PATCH /todos/not-an-int` validation envelope test.
  - Added mutation `DELETE /todos/{id}` not-found envelope test.
- Updated frontend test fidelity for standardized envelopes and surfaced normalized messages:
  - `frontend/src/app/App.test.tsx`
  - `frontend/src/features/todos/components/TodoList.test.tsx`
  - `frontend/src/features/todos/api/normalizeTodoApiError.test.ts`
  - `frontend/src/features/todos/api/createTodo.test.ts`
  - `frontend/src/features/todos/api/updateTodo.test.ts`
  - `frontend/src/features/todos/api/deleteTodo.test.ts`

## Validation
- Backend focused envelope tests:
  - `python3 -m pytest -q tests/test_api_error_responses.py`
  - Result: pass (`7 passed`)
- Backend full suite:
  - `python3 -m pytest -q`
  - Result: pass (`19 passed, 5 subtests passed`)
- Frontend focused suite:
  - `npm run test -- src/app/App.test.tsx src/features/todos/components/TodoList.test.tsx src/features/todos/hooks/useUpdateTodoMutation.test.ts src/features/todos/hooks/useDeleteTodoMutation.test.ts src/features/todos/api/createTodo.test.ts src/features/todos/api/updateTodo.test.ts src/features/todos/api/deleteTodo.test.ts src/features/todos/api/normalizeTodoApiError.test.ts`
  - Result: pass (`52 passed`)
- Frontend full suite:
  - `npm run test`
  - Result: pass (`55 passed`)
- Frontend lint:
  - `npm run lint`
  - Result: pass

## Tracking
- Story file `_bmad-output/implementation-artifacts/3-1-standardized-error-envelope-and-client-error-normalization.md` updated to `done`.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` synced to `done` for `3-1-standardized-error-envelope-and-client-error-normalization`.

## Scope
No new dependencies were added. Changes are limited to Story 3.1 envelope/normalization behavior, scoped error-message surfacing, test coverage, and required story/sprint tracking synchronization.
