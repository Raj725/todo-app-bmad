# Story 3.4: Reconciliation to Persisted Backend Truth

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an end user,
I want the app state to match saved backend data after actions and reload,
so that I can trust what I see.

## Acceptance Criteria

1. Given one or more optimistic mutations have occurred, when server responses complete or refetch is triggered, then client state reconciles to authoritative backend data, and stale optimistic artifacts are removed.
2. Given a page reload occurs after previous task actions, when tasks are fetched again, then displayed data reflects persisted backend truth, and users do not see false-success states.

## Tasks / Subtasks

- [x] Add deterministic post-mutation reconciliation paths across all mutation types (AC: 1)
  - [x] Re-validate `onSettled` invalidation/refetch behavior in `useCreateTodoMutation`, `useUpdateTodoMutation`, and `useDeleteTodoMutation` to ensure server-authoritative state is always restored.
  - [x] Ensure rollback context is fully cleared after settle so stale optimistic snapshots are never reused.
  - [x] Ensure no optimistic placeholder rows or stale in-memory values survive successful settle/refetch cycles.

- [x] Harden refresh/session-return truth alignment in query initialization and render flow (AC: 2)
  - [x] Verify initial list rendering always reflects API results from `useTodosQuery`/`listTodos` rather than stale local mutation artifacts.
  - [x] Ensure empty/loading/error rendering remains accurate during first sync after reload.
  - [x] Confirm active-first ordering (`orderTodos`) is applied to persisted data after refetch, not to stale pre-refetch state.

- [x] Preserve scoped failure isolation while enforcing reconciliation (AC: 1, 2)
  - [x] Keep per-item/action pending and error state scoping (no global lock).
  - [x] Ensure retries continue to use existing mutation hooks and API adapters with normalized errors.
  - [x] Ensure reconciliation changes do not regress Story 3.3 guarantees for unaffected task interactivity.

- [x] Add focused regression coverage for reconciliation correctness (AC: 1, 2)
  - [x] Extend hook/component tests to verify optimistic state is replaced by authoritative server data after settle.
  - [x] Add/extend E2E scenario covering mutation + reload + refetch consistency (no false-success artifact visible after refresh).
  - [x] Add coverage for mixed outcomes (failure then retry success) confirming final rendered list equals persisted backend truth.

- [x] Run quality gates (AC: 1, 2)
  - [x] `frontend`: `npm run test -- src/features/todos`
  - [x] `frontend`: `npm run lint`
  - [x] `frontend`: `npm run test`
  - [x] `backend`: `python3 -m pytest -q`

## Dev Notes

### Story Context and Scope

- This story closes Epic 3 by ensuring the optimistic lifecycle always converges to authoritative backend truth after settle/refetch and after browser reload.
- Scope is reconciliation reliability only; do not add new product features, routes, filters, pagination, auth, or UI redesign.
- This story depends on the existing foundations from Stories 3.1 (error normalization), 3.2 (optimistic lifecycle + rollback), and 3.3 (retry/failure isolation).
- FR coverage: FR22, FR23. NFR emphasis: NFR5, NFR6.

### Technical Requirements

- Maintain mandatory lifecycle contract for all create/update/delete paths:
  1. optimistic apply,
  2. rollback on failure,
  3. scoped inline error,
  4. authoritative query invalidation/refetch on settle.
- Reconciliation must always prefer backend response/query truth over optimistic local assumptions.
- Continue to use standardized error normalization (`normalizeTodoApiError`) and existing transport adapters (`createTodo`, `updateTodo`, `deleteTodo`, `listTodos`).
- Avoid introducing duplicate local caches or alternate data stores that can diverge from TanStack Query server state.
- Preserve deterministic state handling for concurrent actions: one failed mutation must not block unrelated tasks.

### Architecture Compliance

Primary frontend touchpoints:
- `frontend/src/features/todos/hooks/useCreateTodoMutation.ts`
- `frontend/src/features/todos/hooks/useUpdateTodoMutation.ts`
- `frontend/src/features/todos/hooks/useDeleteTodoMutation.ts`
- `frontend/src/features/todos/hooks/useTodosQuery.ts`
- `frontend/src/features/todos/api/listTodos.ts`
- `frontend/src/features/todos/components/TodoList.tsx`
- `frontend/src/features/todos/orderTodos.ts`

Likely test touchpoints:
- `frontend/src/features/todos/hooks/useCreateTodoMutation.test.ts`
- `frontend/src/features/todos/hooks/useUpdateTodoMutation.test.ts`
- `frontend/src/features/todos/hooks/useDeleteTodoMutation.test.ts`
- `frontend/src/features/todos/components/TodoList.test.tsx`
- `frontend/tests/e2e/todo-smoke.spec.ts`

Backend boundaries to preserve:
- API surface remains `GET/POST/PATCH/DELETE /todos`, plus `GET /health`, `GET /ready`.
- Keep route/service/repository layering intact in `backend/app/api/routes/todos.py`, `backend/app/services/todo_service.py`, `backend/app/repositories/todo_repository.py`.

### Library / Framework Requirements

- Continue with existing stack and patterns already in repo:
  - React `19.2.x`
  - TypeScript `5.9.x`
  - TanStack Query `5.90.x`
  - FastAPI `0.135.x`
  - SQLAlchemy `2.0.x`
  - Pydantic `2.12.x`
  - Vitest + Testing Library + Playwright + Pytest
- No new dependency is required for this story.

### File Structure Requirements

- Keep reconciliation behavior in existing todo feature hooks and API utilities under `frontend/src/features/todos/**`.
- Keep API snake_case at the transport boundary; maintain camelCase in frontend domain types via existing mapping utilities.
- Keep status/list rendering behavior in existing task components; avoid introducing a parallel view model layer.
- Keep changes focused and incremental; do not reorganize folder structure in this story.

### Testing Requirements

Frontend behavior expectations:
- Post-mutation state converges to authoritative backend truth after settle/refetch.
- Reloaded page state reflects persisted backend data, not optimistic placeholders.
- Scoped pending/error behavior remains local to affected action/task.
- Retry + reconciliation combination does not leave stale false-success state in list.

E2E expectations:
- Perform mutation flow, force failure/retry where applicable, reload page, then verify list equals persisted backend result.
- Confirm no stale optimistic row or stale toggled state survives refresh.

Backend regression expectations:
- Existing standardized envelopes and mutation contract remain stable while reconciliation tests run through current endpoints.

### Previous Story Intelligence

Carry forward from Story 3.3 (`done`):
- Reuse existing scoped retry and failure-isolation patterns; avoid reintroducing global lock semantics.
- Reuse current mutation pathways and avoid bypassing hook-level lifecycle logic.
- Preserve accessible, local retry/error affordances in row context.
- Keep behavior test-first and regression-focused; recent changes concentrated in `TodoList`, mutation hooks, and smoke E2E.

### Git Intelligence Summary

Recent relevant commit patterns:
- `856fb5e` fix(review-3.3): apply code-review fixes for retry/isolation story
- `f0df335` feat(story-3.3): complete retry flows and failure isolation
- `96ea489` Story 3.3: Retry Flows and Failure Isolation
- `03011e6` docs(status): refresh sprint snapshot after QA automation completion

Actionable guidance for this story:
- Follow the same reliability-first incremental style: small lifecycle changes + targeted tests.
- Prefer extending existing hook/component code paths instead of introducing new abstractions.
- Keep implementation aligned with established naming and behavior patterns used in Story 3.3.

### Latest Technical Information

- External web research was not executed in this run.
- Guidance is based on in-repository planning and architecture artifacts plus current project dependency strategy.

### Project Structure Notes

- No `project-context.md` file was found in workspace.
- Canonical planning sources for this story are:
  - `_bmad-output/planning-artifacts/epics.md`
  - `_bmad-output/planning-artifacts/prd.md`
  - `_bmad-output/planning-artifacts/architecture.md`
  - `_bmad-output/planning-artifacts/ux-design-specification.md`

### References

- Story definition: `_bmad-output/planning-artifacts/epics.md` (Epic 3, Story 3.4)
- Product requirements: `_bmad-output/planning-artifacts/prd.md` (FR22, FR23; NFR5, NFR6)
- Architecture guardrails: `_bmad-output/planning-artifacts/architecture.md` (mandatory optimistic lifecycle, reconciliation to backend truth, API envelope discipline)
- UX behavior constraints: `_bmad-output/planning-artifacts/ux-design-specification.md` (localized feedback, retry clarity, no global blocking)
- Previous story context: `_bmad-output/implementation-artifacts/3-3-retry-flows-and-failure-isolation.md`

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- Loaded BMAD module config from `_bmad/bmm/config.yaml` and resolved workflow variables.
- Loaded workflow engine `_bmad/core/tasks/workflow.xml`.
- Loaded create-story workflow (`workflow.yaml`, `instructions.xml`, `template.md`, `checklist.md`).
- Parsed `_bmad-output/implementation-artifacts/sprint-status.yaml` fully and auto-selected first backlog story: `3-4-reconciliation-to-persisted-backend-truth`.
- Loaded and analyzed planning artifacts: `epics.md`, `prd.md`, `architecture.md`, `ux-design-specification.md`.
- Loaded previous story intelligence from `3-3-retry-flows-and-failure-isolation.md`.
- Reviewed recent git commit history and changed-file patterns for implementation continuity.
- Created this story context document with status set to `ready-for-dev`.
- Selected Story 3.4 from sprint status and switched to branch `feat/3-4-reconciliation-to-persisted-backend-truth` before code changes.
- Added red-phase reconciliation tests for create/update/delete hooks covering inactive-query authoritative refetch on settle.
- Implemented reconciliation hardening by invalidating todos queries with `refetchType: 'all'` in all mutation hooks.
- Added mixed outcome coverage (failure then retry success) asserting final cache converges to persisted backend truth.
- Extended Playwright smoke coverage with mutation + retry + reload reconciliation scenario.
- Ran all required quality gates and verified passing results for frontend and backend test suites.

### Implementation Plan

- Enforce deterministic reconciliation at mutation settle boundaries across create/update/delete by refetching all todos query instances.
- Preserve existing scoped pending/error behavior to avoid global lock regressions while reconciliation is strengthened.
- Validate convergence to backend truth with targeted hook tests, then confirm reload/refetch behavior via E2E coverage.
- Run story-mandated quality gates and complete story tracking updates only after all validations pass.

### Completion Notes List

- ✅ Comprehensive story context created for Story 3.4 with architecture, UX, and implementation guardrails.
- ✅ Tasks/subtasks align directly to ACs and existing project structure.
- ✅ Previous-story and git intelligence integrated to reduce implementation risk and regressions.
- ✅ Story is ready for `dev-story` execution.
- ✅ Ultimate context engine analysis completed - comprehensive developer guide created.
- ✅ Hardened reconciliation in `useCreateTodoMutation`, `useUpdateTodoMutation`, and `useDeleteTodoMutation` by refetching all matching todo queries on settle.
- ✅ Added focused regression tests proving inactive-query caches reconcile to authoritative backend data after settle.
- ✅ Added mixed failure→retry-success coverage validating final state convergence to persisted backend truth.
- ✅ Added E2E mutation + retry + reload scenario to verify no false-success artifacts survive refresh.
- ✅ Quality gates passed: `npm run test -- src/features/todos`, `npm run lint`, `npm run test`, and `python3 -m pytest -q`.
- ✅ No README impact: changes were limited to todo mutation/query behavior and automated tests; existing service commands and setup docs remain accurate.

### File List

- _bmad-output/implementation-artifacts/3-4-reconciliation-to-persisted-backend-truth.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- frontend/src/features/todos/hooks/useCreateTodoMutation.ts
- frontend/src/features/todos/hooks/useUpdateTodoMutation.ts
- frontend/src/features/todos/hooks/useDeleteTodoMutation.ts
- frontend/src/features/todos/hooks/useCreateTodoMutation.test.ts
- frontend/src/features/todos/hooks/useUpdateTodoMutation.test.ts
- frontend/src/features/todos/hooks/useDeleteTodoMutation.test.ts
- frontend/tests/e2e/todo-smoke.spec.ts

### Change Log

- 2026-03-06: Story created and prepared for implementation handoff (`ready-for-dev`).
- 2026-03-06: Implemented deterministic post-mutation reconciliation and regression coverage; story moved to `review`.
