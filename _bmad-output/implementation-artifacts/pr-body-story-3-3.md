## Summary
- Complete Story 3.3 retry flows and failure isolation.
- Add scoped retry control for failed toggle actions directly in todo row context.
- Preserve action-level isolation so one failed action does not block unrelated task actions.
- Extend test coverage for create retry recovery and mixed-outcome retry/isolation E2E behavior.

## Story
- Story file: `_bmad-output/implementation-artifacts/3-3-retry-flows-and-failure-isolation.md`
- Story status: `review`
- Sprint status key: `3-3-retry-flows-and-failure-isolation: review`

## What Changed
- UI: add scoped toggle retry affordance with explicit accessible label.
- Tests: add/extend focused coverage for retry success and failure isolation.
- Tracking: update story task checklist, dev agent record, file list, change log, and sprint status.

## Files
- `_bmad-output/implementation-artifacts/3-3-retry-flows-and-failure-isolation.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `frontend/src/features/todos/components/TodoList.tsx`
- `frontend/src/features/todos/components/TodoList.test.tsx`
- `frontend/src/features/todos/hooks/useCreateTodoMutation.test.ts`
- `frontend/tests/e2e/todo-smoke.spec.ts`

## Validation
- `frontend`: `npm run test -- src/features/todos`
- `frontend`: `npm run test`
- `frontend`: `npm run lint`
- `backend`: `python3 -m pytest -q`
- `frontend e2e targeted`: `npx playwright test tests/e2e/todo-smoke.spec.ts -g "failed mutation remains scoped and does not block unrelated task actions"`

## Acceptance Criteria Coverage
- **AC1**: Failed action retry now has deterministic, scoped UX for toggle; create/edit/delete retry paths remain through existing mutation adapters.
- **AC2**: Failure state remains scoped by action/task identity; unrelated task actions stay usable under mixed outcomes.
