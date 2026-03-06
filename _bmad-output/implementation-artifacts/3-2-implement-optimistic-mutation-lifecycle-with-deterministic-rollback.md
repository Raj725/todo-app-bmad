# Story 3.2: Implement Optimistic Mutation Lifecycle with Deterministic Rollback

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an end user,
I want immediate feedback when I perform task actions,
so that the interface feels responsive while remaining trustworthy.

## Acceptance Criteria

1. Given create, update, or delete is initiated, when the action starts, then optimistic UI feedback appears within 500 ms under normal conditions, and in-progress indicators are limited to the affected item/action.
2. Given a mutation request fails, when failure is returned, then the optimistic change is rolled back to a consistent prior state, and the user sees explicit failure feedback and retry affordance.

## Tasks / Subtasks

- [x] Define and enforce a single optimistic mutation lifecycle across create/update/delete (AC: 1, 2)
  - [x] Standardize lifecycle phases in mutation hooks: `onMutate` optimistic apply, snapshot capture, `onError` rollback, scoped error publication, `onSettled` invalidate/refetch.
  - [x] Ensure rollback always uses deterministic snapshot/patch metadata from mutation context (never recompute from current UI state).
  - [x] Keep mutation-scope isolation so one failed action does not block unrelated rows/actions.

- [x] Implement frontend optimistic behavior for create/update/delete with deterministic rollback (AC: 1, 2)
  - [x] `create`: optimistic row appears immediately with pending affordance; failure removes optimistic row and surfaces scoped error.
  - [x] `update` (toggle/edit): optimistic field/state update applies immediately; failure restores exact previous task snapshot.
  - [x] `delete`: optimistic removal occurs immediately; failure re-inserts task at deterministic previous position.
  - [x] Preserve adapter boundaries: API snake_case stays at API edge; UI/cache domain remains camelCase.

- [x] Wire explicit, scoped feedback and retry affordances (AC: 1, 2)
  - [x] Keep pending indicators limited to affected control/row and quick-add submit action only.
  - [x] Keep error messaging scoped to affected action context (quick-add vs specific list row action).
  - [x] Ensure retry action reuses the same mutation path and error normalization from Story 3.1.

- [x] Reconcile to authoritative backend state after each mutation cycle (AC: 2)
  - [x] Invalidate/refetch todos query after mutation settles to prevent stale optimistic artifacts.
  - [x] Preserve list ordering rules (active-first, stable deterministic ordering) after rollback and after authoritative refetch.

- [x] Add focused tests for optimistic apply, rollback, and state isolation (AC: 1, 2)
  - [x] Frontend mutation hook/component tests: optimistic create/update/delete appears quickly and pending is scoped.
  - [x] Frontend failure-path tests: deterministic rollback and scoped retry affordance for each mutation type.
  - [x] E2E smoke/failure path check: failed mutation does not corrupt unrelated task interactions.
  - [x] Backend regression check: existing error envelope contract still drives predictable frontend rollback triggers.

- [x] Run quality gates (AC: 1, 2)
  - [x] `frontend`: `npm run test -- src/features/todos` (or focused mutation suites if narrower)
  - [x] `frontend`: `npm run lint`
  - [x] `backend`: `python3 -m pytest -q`

## Dev Notes

### Story Context and Scope

- This story is the second implementation story in Epic 3 and depends on Story 3.1’s standardized error envelope + client normalization baseline.
- Scope is strictly optimistic lifecycle mechanics for create/update/delete, deterministic rollback, and scoped feedback/retry. Do not add new product features, routes, or UI surfaces.
- This story establishes the reliability behavior needed before Story 3.3 (retry/failure isolation) and Story 3.4 (reconciliation to persisted truth) are finalized.
- FR coverage: FR14, FR15, FR16, FR18, FR23.

### Technical Requirements

- Apply one shared mutation lifecycle pattern for all task mutations:
  1. optimistic apply within 500 ms
  2. capture deterministic rollback context
  3. rollback on failure + scoped user-readable error
  4. invalidate/refetch authoritative todos state
- Rollback semantics must be deterministic per mutation type:
  - `create`: remove optimistic entity on failure
  - `update`: restore previous snapshot values exactly
  - `delete`: restore removed entity in prior deterministic list location/state
- Maintain strict success-envelope parsing and Story 3.1 error normalization usage for failure signals.
- Keep pending/error state isolation: only affected row/action disabled/marked pending; no global lock.

### Architecture Compliance

Frontend likely touchpoints:
- `frontend/src/features/todos/hooks/useCreateTodoMutation.ts`
- `frontend/src/features/todos/hooks/useUpdateTodoMutation.ts`
- `frontend/src/features/todos/hooks/useDeleteTodoMutation.ts`
- `frontend/src/features/todos/api/createTodo.ts`
- `frontend/src/features/todos/api/updateTodo.ts`
- `frontend/src/features/todos/api/deleteTodo.ts`
- `frontend/src/features/todos/api/normalizeTodoApiError.ts`
- `frontend/src/features/todos/components/TodoQuickAdd.tsx`
- `frontend/src/features/todos/components/TodoList.tsx`
- `frontend/src/app/App.tsx`

Backend (regression/contract touchpoints only):
- `backend/app/api/error_handlers.py`
- `backend/tests/test_api_error_responses.py`

Boundary rules to preserve:
- Frontend feature-first organization and shared API utilities stay intact.
- Backend route/service/repository separation unchanged.
- No new endpoint surface beyond existing `/todos`, `/health`, `/ready`.

### Library / Framework Requirements

Use existing repository stack and versions already selected in architecture and current codebase:
- React `19.2.x`
- TypeScript `5.9.x`
- TanStack Query `5.90.x`
- FastAPI `0.135.x`
- Pydantic `2.12.x`
- Pytest + Vitest/Testing Library

No additional dependencies are required.

### File Structure Requirements

- Keep optimistic logic primarily in mutation hooks and query-cache lifecycle handlers.
- Keep transport + error parsing in API adapter utilities; do not duplicate parsing logic in components.
- Keep UI scoped feedback in existing task components (quick-add/list row) without adding new pages/modals.

### Testing Requirements

Frontend behavioral expectations:
- Optimistic visual feedback for create/update/delete appears immediately and within UX target window.
- On mutation failure, rollback returns list state to consistent pre-mutation state with deterministic ordering.
- Error messages remain scoped to affected action; unrelated task controls remain usable.
- Retry affordance executes the same mutation path and clears scoped error on success.

Backend contract expectations (regression):
- Mutation failure responses continue to return standardized machine-readable envelope required by client normalizer.

### Previous Story Intelligence

Key carry-forward learnings from Story 3.1:
- Reuse centralized error normalization (`normalizeTodoApiError`) rather than per-mutation parsing.
- Keep failure feedback scoped by action context (quick-add vs specific row action).
- Preserve typed backend error-envelope construction and integration tests to avoid contract drift.
- Keep test fixtures/mocks aligned with full standardized envelope shape to avoid false positives.

### Git Intelligence Summary

Recent commit patterns indicate:
- Reliability work is concentrated in mutation adapters/hooks and app-level scoped feedback behavior.
- Code-review fixes recently emphasized strict scoping of normalized errors and stronger envelope test fidelity.
- Continue extending existing patterns rather than introducing alternate mutation/state management paths.

Recent commits reviewed:
- `7a5e70b` fix(story-3.1): apply code-review fixes for scoped normalized errors
- `200e02d` docs(story-3.1): add PR body artifact
- `2a48a30` feat(story-3.1): standardize mutation error envelopes and client normalization
- `0199718` fix(story-2.4): resolve code-review findings for ordering and toggle errors
- `a5095ff` feat(story-2.4): enforce actionable ordering and status clarity

### Latest Technical Information

- External web research was not executed in this run.
- Guidance is based on repository artifacts and current pinned dependency strategy from architecture/planning docs.

### Project Structure Notes

- No `project-context.md` file was discovered.
- Canonical sources remain `_bmad-output/planning-artifacts/` and completed implementation artifacts in `_bmad-output/implementation-artifacts/`.

### References

- Story definition: `_bmad-output/planning-artifacts/epics.md` (Epic 3, Story 3.2)
- Product requirements: `_bmad-output/planning-artifacts/prd.md` (FR14, FR15, FR16, FR18, FR23; NFR1, NFR5, NFR6)
- Architecture rules: `_bmad-output/planning-artifacts/architecture.md` (API response envelope, optimistic lifecycle, boundary patterns)
- UX behavior constraints: `_bmad-output/planning-artifacts/ux-design-specification.md` (Journey 1/2, scoped feedback, failure recovery)
- Previous implementation learnings: `_bmad-output/implementation-artifacts/3-1-standardized-error-envelope-and-client-error-normalization.md`

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- Loaded BMAD module config from `_bmad/bmm/config.yaml` and resolved all configuration variables.
- Loaded workflow engine `_bmad/core/tasks/workflow.xml` and create-story workflow configuration.
- Auto-discovered next backlog story from `sprint-status.yaml`: `3-2-implement-optimistic-mutation-lifecycle-with-deterministic-rollback`.
- Analyzed core planning artifacts (`epics.md`, `prd.md`, `architecture.md`, `ux-design-specification.md`).
- Analyzed prior Epic 3 story artifact (`3-1-standardized-error-envelope-and-client-error-normalization.md`) for carry-forward constraints.
- Reviewed recent git commit history for implementation pattern continuity.
- Switched to branch `feat/3-2-implement-optimistic-mutation-lifecycle-with-deterministic-rollback` per workflow branch policy.
- Added red-phase tests for create optimistic lifecycle and deterministic delete rollback position behavior.
- Implemented deterministic create/delete rollback context handling in mutation hooks and preserved scoped feedback behavior.
- Added optimistic create pending affordance in todo list row rendering.
- Added E2E failure-isolation smoke test coverage for scoped rollback behavior.
- Executed required quality gates: frontend feature tests, frontend lint, backend pytest, plus targeted Playwright validation.

### Completion Notes List

- ✅ Comprehensive story context created for Epic 3 Story 3.2 with implementation-ready requirements and guardrails.
- ✅ Deterministic optimistic lifecycle requirements captured for create/update/delete with rollback/refetch semantics.
- ✅ Scoped pending/error/retry UX requirements aligned to prior story and architecture guidance.
- ✅ Previous-story and git intelligence incorporated to reduce regression risk and avoid duplicate patterns.
- ✅ Sprint tracking updated to mark this story `ready-for-dev`.
- ✅ Unified optimistic mutation lifecycle confirmed across create/update/delete (`onMutate` → `onError` rollback → `onSettled` invalidate/refetch).
- ✅ Create rollback now removes only the optimistic row by deterministic context ID, preventing stale whole-list overwrite.
- ✅ Delete rollback now restores failed item at deterministic previous list position using mutation context index metadata.
- ✅ Optimistic create rows now show explicit row-level pending affordance while mutation is in flight.
- ✅ Added focused tests for create/delete rollback behavior and pending affordance; added E2E failure-isolation check.
- ✅ Quality gates passed: `npm run test -- src/features/todos`, `npm run lint`, `python3 -m pytest -q`, and `npx playwright test tests/e2e/todo-smoke.spec.ts`.

### File List

- _bmad-output/implementation-artifacts/3-2-implement-optimistic-mutation-lifecycle-with-deterministic-rollback.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- frontend/src/features/todos/hooks/useCreateTodoMutation.ts
- frontend/src/features/todos/hooks/useDeleteTodoMutation.ts
- frontend/src/features/todos/components/TodoList.tsx
- frontend/src/features/todos/hooks/useCreateTodoMutation.test.ts
- frontend/src/features/todos/hooks/useDeleteTodoMutation.test.ts
- frontend/src/features/todos/components/TodoList.test.tsx
- frontend/tests/e2e/todo-smoke.spec.ts
- _bmad-output/implementation-artifacts/3-2-implement-optimistic-mutation-lifecycle-with-deterministic-rollback.md
- _bmad-output/implementation-artifacts/sprint-status.yaml

### Change Log

- 2026-03-06: Story created and prepared for implementation handoff (`ready-for-dev`).
- 2026-03-06: Implemented Story 3.2 optimistic mutation lifecycle with deterministic rollback, scoped feedback/retry, E2E failure isolation, and passed quality gates; status moved to `review`.
- 2026-03-06: Senior Developer Review (AI) identified and fixed optimistic create lifecycle defects (ID-collision rollback risk and create-success duplicate race), added regression tests, and moved status to `done`.

### Senior Developer Review (AI)

Reviewer: Raj (GPT-5.3-Codex)
Date: 2026-03-06
Outcome: Approved after fixes

#### Findings

- HIGH: Optimistic create IDs were generated from `-Date.now()`, which can collide for concurrent creates in the same millisecond and cause rollback to remove multiple optimistic rows.
- MEDIUM: Create `onSuccess` could append a duplicate authoritative todo when the cache already contained the server item due to refetch race timing.
- MEDIUM: No regression tests existed to protect against optimistic-create ID collision and duplicate-authoritative insertion race behavior.

#### Fixes Applied

- Updated optimistic ID generation in `useCreateTodoMutation` to derive a unique negative ID from current cache state.
- Hardened create `onSuccess` merge logic to avoid appending duplicate authoritative todos by ID.
- Added focused regression tests in `useCreateTodoMutation.test.ts` for concurrent unique optimistic IDs and duplicate-race prevention.

#### Validation Evidence

- `cd frontend && npm run test -- src/features/todos/hooks/useCreateTodoMutation.test.ts` (pass)
- `cd frontend && npm run lint` (pass)
