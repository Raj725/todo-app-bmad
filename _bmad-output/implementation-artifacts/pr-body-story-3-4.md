## Summary
- Complete Story 3.4: reconciliation to persisted backend truth.
- Harden post-mutation convergence by refetching all todos query instances on settle for create/update/delete mutations.
- Add regression coverage for inactive-query reconciliation, mixed failure→retry success convergence, and mutation+reload consistency.
- Update sprint/story tracking artifacts to `review`.

## What changed
- `frontend/src/features/todos/hooks/useCreateTodoMutation.ts`
  - Use `invalidateQueries({ queryKey: TODOS_QUERY_KEY, refetchType: 'all' })` on settle.
- `frontend/src/features/todos/hooks/useUpdateTodoMutation.ts`
  - Use `invalidateQueries({ queryKey: TODOS_QUERY_KEY, refetchType: 'all' })` on settle.
- `frontend/src/features/todos/hooks/useDeleteTodoMutation.ts`
  - Use `invalidateQueries({ queryKey: TODOS_QUERY_KEY, refetchType: 'all' })` on settle.
- `frontend/src/features/todos/hooks/useCreateTodoMutation.test.ts`
  - Add reconciliation test ensuring authoritative backend data replaces stale cache when query is inactive.
- `frontend/src/features/todos/hooks/useUpdateTodoMutation.test.ts`
  - Add inactive-query reconciliation test.
  - Add mixed failure→retry success test ensuring final cache equals persisted backend truth.
- `frontend/src/features/todos/hooks/useDeleteTodoMutation.test.ts`
  - Add inactive-query reconciliation test.
- `frontend/tests/e2e/todo-smoke.spec.ts`
  - Add E2E scenario: failure then retry success, reload, verify backend-truth state and no stale false-success artifact.
- `_bmad-output/implementation-artifacts/3-4-reconciliation-to-persisted-backend-truth.md`
  - Mark all tasks complete and set status to `review`.
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
  - Move story `3-4-reconciliation-to-persisted-backend-truth` to `review`.

## Acceptance Criteria mapping
- **AC1**: Reconciliation after optimistic mutations is deterministic and authoritative backend data is restored after settle/refetch.
- **AC2**: Reload and subsequent fetch reflect persisted backend truth; no stale optimistic artifacts remain visible.

## Validation
- `frontend`: `npm run test -- src/features/todos`
- `frontend`: `npm run lint`
- `frontend`: `npm run test`
- `frontend`: `npm run test:e2e -- -g "mutation failure then retry success reconciles after reload to persisted backend truth"`
- `backend`: `python3 -m pytest -q`

## Risks / Notes
- Change is intentionally scoped to mutation settle reconciliation and tests.
- No new dependencies introduced.
- No backend API contract changes.
