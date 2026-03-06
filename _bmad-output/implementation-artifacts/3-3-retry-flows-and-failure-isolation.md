# Story 3.3: Retry Flows and Failure Isolation

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an end user,
I want to retry failed task actions without disrupting other tasks,
so that I can recover quickly and keep working.

## Acceptance Criteria

1. Given one task action fails, when the user retries the failed action, then the retry executes successfully when the backend is available, and success/failure outcome is clearly reflected for that action.
2. Given one task remains in failed state, when the user performs actions on other tasks, then unaffected tasks remain fully usable, and no global UI lock blocks unrelated work.

## Tasks / Subtasks

- [x] Implement deterministic retry affordances for all failed mutation scopes (AC: 1)
  - [x] Ensure retry entry points exist for create, toggle/update, edit, and delete failures in the same UI context where failure is shown.
  - [x] Reuse existing mutation pathways (`mutate` calls), never duplicate network logic or bypass adapter-level normalization.
  - [x] Clear scoped failure state on successful retry and preserve clear failure state when retry fails again.

- [x] Enforce failure isolation across concurrent actions (AC: 2)
  - [x] Keep pending/error state scoped by task/action identity (per-id sets/maps) so one failed action does not disable unrelated rows.
  - [x] Ensure quick-add failures do not block list-row toggle/edit/delete actions and vice versa.
  - [x] Prevent introduction of list-level/global mutation locks for single-item failures.

- [x] Preserve optimistic lifecycle contract during retries (AC: 1, 2)
  - [x] Keep lifecycle order: optimistic apply → rollback on failure → scoped inline error → retry → authoritative refetch on settle.
  - [x] Ensure retries remain deterministic with existing rollback context semantics from Story 3.2.
  - [x] Verify active-first ordering and status clarity remain stable before and after retry attempts.

- [x] Keep UX and accessibility behavior aligned for failure/retry paths (AC: 1, 2)
  - [x] Keep retry controls keyboard-operable with clear accessible labels in the affected control scope.
  - [x] Keep user feedback explicit and local (no ambiguity about which action failed or retried).
  - [x] Preserve predictable focus behavior after failed actions and retry invocation.

- [x] Add focused test coverage for retry and isolation outcomes (AC: 1, 2)
  - [x] Hook/component tests for failed-then-successful retry per action type.
  - [x] Hook/component tests proving failure in one task/action does not disable unrelated actions.
  - [x] E2E regression scenario covering mixed outcomes (one action fails and retries while another task action succeeds).

- [x] Run quality gates (AC: 1, 2)
  - [x] `frontend`: `npm run test -- src/features/todos`
  - [x] `frontend`: `npm run lint`
  - [x] `backend`: `python3 -m pytest -q`

## Dev Notes

### Story Context and Scope

- This story extends Epic 3 reliability work after Story 3.2 by hardening user recovery patterns (retry) and strict action-level isolation.
- Scope is retry and isolation behavior only; do not add new product features, pages, endpoints, filters, or design-system variants.
- Existing code already includes partial retry/isolation behaviors (for edit/delete and some toggle isolation). This story should standardize and complete the matrix across all mutation types.
- FR coverage: FR17, FR19.

### Technical Requirements

- Preserve and extend existing mutation hook contract patterns:
  - maintain per-action scoped error maps/sets,
  - provide deterministic retry callbacks for failed operations,
  - clear only relevant scoped failures on success.
- Retry operations must route through existing API adapters (`createTodo`, `updateTodo`, `deleteTodo`) so standardized error envelope normalization from Story 3.1 remains authoritative.
- Keep retry behavior idempotent from UI perspective: repeated retry attempts should not create duplicate local state entries or stale error artifacts.
- Maintain authoritative query invalidation on mutation settle to avoid stale optimistic artifacts.
- Do not add global `isMutating` gating that blocks unrelated task actions.

### Architecture Compliance

Likely frontend touchpoints:
- `frontend/src/app/App.tsx`
- `frontend/src/features/todos/components/TodoQuickAdd.tsx`
- `frontend/src/features/todos/components/TodoList.tsx`
- `frontend/src/features/todos/hooks/useCreateTodoMutation.ts`
- `frontend/src/features/todos/hooks/useUpdateTodoMutation.ts`
- `frontend/src/features/todos/hooks/useDeleteTodoMutation.ts`
- `frontend/src/features/todos/hooks/useTodosQuery.ts`
- `frontend/src/features/todos/orderTodos.ts`

Likely tests to extend:
- `frontend/src/features/todos/hooks/useCreateTodoMutation.test.ts`
- `frontend/src/features/todos/hooks/useUpdateTodoMutation.test.ts`
- `frontend/src/features/todos/hooks/useDeleteTodoMutation.test.ts`
- `frontend/src/features/todos/components/TodoList.test.tsx`
- `frontend/tests/e2e/todo-smoke.spec.ts`

Boundary rules to preserve:
- Frontend feature-first module boundaries stay intact.
- API snake_case stays at transport boundary; UI domain remains camelCase.
- Backend route/service/repository separation is unchanged for this story.
- API surface remains strict MVP set (`GET/POST/PATCH/DELETE /todos`, `GET /health`, `GET /ready`).

### Library / Framework Requirements

Use the existing stack and versions already present in repo architecture:
- React `19.2.x`
- TypeScript `5.9.x`
- TanStack Query `5.90.x`
- FastAPI `0.135.x`
- Pydantic `2.12.x`
- Vitest + Testing Library + Playwright + Pytest

No new dependencies are required for this story.

### File Structure Requirements

- Keep retry/isolation logic inside existing todo mutation hooks and todo UI components.
- Keep API contract parsing in existing adapter utilities; do not replicate normalization logic in components.
- Keep story changes localized to `frontend/src/features/todos/**` and app wiring unless a strict backend contract test update is needed.

### Testing Requirements

Frontend behavior expectations:
- Failed actions expose retry controls scoped to the relevant action/task.
- Retry success clears scoped error state and confirms success outcome in-place.
- Retry failure preserves scoped error state without disabling other task actions.
- Unrelated tasks remain interactive while a failed action exists on another task.
- Keyboard users can trigger retry controls in all applicable failure paths.

E2E expectations:
- One task/action can fail and be retried while another task action succeeds in the same session.
- No global lock behavior appears during mixed success/failure concurrency.

Backend expectations (regression only):
- Standardized error envelope contract remains stable for all mutation endpoints used by retries.

### Previous Story Intelligence

Carry forward from Story 3.2 (`done`):
- Reuse deterministic rollback context patterns already implemented for create/update/delete.
- Reuse scoped pending/error data structures (`Set`/`Map` keyed by todo id) rather than introducing parallel state systems.
- Preserve centralized error normalization (`normalizeTodoApiError`) and avoid action-specific custom parser drift.
- Preserve query invalidation on settle as authoritative state reconciliation step.

### Git Intelligence Summary

Recent commit patterns to follow:
- `03011e6` docs(status): refresh sprint snapshot after QA automation completion
- `37d9cbd` test(qa): add PATCH empty-payload API validation and delete-workflow E2E coverage
- `9f570fd` test(cors): avoid DB dependency in health CORS check
- `6c74328` fix(cors): enable backend CORS for local frontend origins and add real-browser regression coverage
- `a8adbef` fix(story-3.2): harden optimistic create rollback and review closeout

Actionable guidance:
- Continue reliability-focused, test-backed incremental changes.
- Prefer extending current mutation/test patterns over introducing new abstractions.
- Keep behavior-centric naming and scoped failure assertions in tests.

### Latest Technical Information

- External web research was not executed in this run.
- Guidance is based on repository planning/architecture artifacts and current dependency strategy.

### Project Structure Notes

- No `project-context.md` file was found.
- Canonical planning sources remain:
  - `_bmad-output/planning-artifacts/epics.md`
  - `_bmad-output/planning-artifacts/prd.md`
  - `_bmad-output/planning-artifacts/architecture.md`
  - `_bmad-output/planning-artifacts/ux-design-specification.md`

### References

- Story definition: `_bmad-output/planning-artifacts/epics.md` (Epic 3, Story 3.3)
- Product requirements: `_bmad-output/planning-artifacts/prd.md` (FR17, FR19; NFR1, NFR5, NFR10)
- Architecture guardrails: `_bmad-output/planning-artifacts/architecture.md` (optimistic mutation lifecycle, standardized envelopes, scoped pending/error patterns)
- UX behavior constraints: `_bmad-output/planning-artifacts/ux-design-specification.md` (localized feedback, retry recoverability, no global blocking)
- Previous story context: `_bmad-output/implementation-artifacts/3-2-implement-optimistic-mutation-lifecycle-with-deterministic-rollback.md`

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- Loaded BMAD module config from `_bmad/bmm/config.yaml` and resolved workflow variables.
- Loaded workflow engine `_bmad/core/tasks/workflow.xml`.
- Loaded create-story workflow configuration and instructions.
- Parsed `_bmad-output/implementation-artifacts/sprint-status.yaml` fully and auto-selected first backlog story: `3-3-retry-flows-and-failure-isolation`.
- Analyzed core planning artifacts: `epics.md`, `prd.md`, `architecture.md`, `ux-design-specification.md`.
- Analyzed previous story intelligence from `3-2-implement-optimistic-mutation-lifecycle-with-deterministic-rollback.md`.
- Reviewed recent git commits for implementation and testing pattern continuity.
- Switched to story branch `feat/3-3-retry-flows-and-failure-isolation` before code changes.
- Added failing tests first for scoped toggle retry UX and create retry lifecycle handling.
- Implemented scoped toggle retry control in `TodoList` using existing `onToggleTodo` mutation pathway.
- Extended E2E mixed-outcome scenario to verify failed action retry success while unrelated task remains interactive.
- Executed story quality gates and regression suites:
  - `frontend`: `npm run test -- src/features/todos`
  - `frontend`: `npm run lint`
  - `backend`: `python3 -m pytest -q`
  - `frontend`: `npm run test`

### Completion Notes List

- ✅ Added scoped toggle retry affordance with explicit accessible labeling and local inline error context.
- ✅ Preserved deterministic mutation lifecycle by reusing existing mutation hooks and cache rollback/refetch behavior.
- ✅ Added focused test coverage for create retry success, toggle retry UX, and failure isolation for unaffected task controls.
- ✅ Extended Playwright mixed outcome scenario to assert one failed action can be retried successfully while another task action succeeds.
- ✅ Quality gates passed (`frontend` tests + lint, `backend` pytest, full frontend regression).
- ✅ No README impact: implementation is internal retry/isolation behavior only, with no setup, command, API, or deployment contract changes.

### File List

- _bmad-output/implementation-artifacts/3-3-retry-flows-and-failure-isolation.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- frontend/src/features/todos/components/TodoList.tsx
- frontend/src/features/todos/components/TodoList.test.tsx
- frontend/src/features/todos/hooks/useCreateTodoMutation.test.ts
- frontend/tests/e2e/todo-smoke.spec.ts

### Change Log

- 2026-03-06: Story created and prepared for implementation handoff (`ready-for-dev`).
- 2026-03-06: Implemented retry/failure-isolation completion for Story 3.3 and advanced story status to `review` after passing quality gates.
