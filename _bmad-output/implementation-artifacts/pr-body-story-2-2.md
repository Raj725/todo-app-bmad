## Summary
Completes Story 2.2 (`Delete Task with Lightweight Confirmation`) by addressing all AI code-review follow-ups and finalizing story status.

## What changed
- Fixed delete mutation rollback concurrency behavior in `useDeleteTodoMutation` to restore only the failed item instead of replacing the full list snapshot.
- Added regression coverage for concurrent delete success/failure interactions in `useDeleteTodoMutation.test.ts`.
- Added app-level UI tests for delete confirm/cancel and failed-delete retry flows in `App.test.tsx`.
- Corrected backend repository contract: `TodoRepository.delete` now returns `bool | None` (matches implementation and docstring).
- Updated backend and frontend READMEs to include `DELETE /todos/{todo_id}` endpoint/API integration parity.
- Updated story artifact and sprint tracking:
  - Story `2-2-delete-task-with-lightweight-confirmation` moved to `done`.
  - `_bmad-output/implementation-artifacts/sprint-status.yaml` synced to `done`.

## Validation
- Frontend targeted tests:
  - `npm run test -- src/features/todos/hooks/useDeleteTodoMutation.test.ts src/app/App.test.tsx`
  - Result: `18 passed`
- Frontend lint:
  - `npm run lint`
  - Result: pass
- Backend tests:
  - `python3 -m pytest -q`
  - Result: `14 passed, 5 subtests passed`

## Scope
No new dependencies, no API contract expansion beyond documented delete endpoint parity, and no unrelated refactors.
