# Story 1.4: Quick-Add Task Flow with Immediate Feedback

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an end user,
I want to add a task from the primary list view,
so that I can capture work with minimal interaction cost.

## Acceptance Criteria

1. Given the quick-add input is visible, when the user submits a valid task, then the new task appears with visible feedback within 500 ms under normal conditions, and the create control reflects in-progress state only for the affected action.
2. Given the create request fails, when failure is returned, then the UI shows explicit error feedback, and the user is offered a clear retry path.

## Tasks / Subtasks

- [ ] Add frontend create API adapter and mutation hook using existing API/error conventions (AC: 1, 2)
  - [ ] Add `createTodo` API function in `frontend/src/features/todos/api/` that calls `POST /todos` and validates `{ data: { ... } }` envelope shape
  - [ ] Reuse existing snake_case → camelCase mapping conventions from list adapter (`created_at` → `createdAt`, `is_completed` → `isCompleted`)
  - [ ] Add `useCreateTodoMutation` hook with TanStack Query mutation lifecycle and list query invalidation
- [ ] Implement quick-add UI in primary list view with scoped pending/error behavior (AC: 1, 2)
  - [ ] Add always-visible quick-add control in `frontend/src/app/App.tsx` (or feature component extracted under `frontend/src/features/todos/components/`)
  - [ ] Disable only quick-add submit action while create is pending; do not block list rendering or unrelated controls
  - [ ] Show explicit inline error on failure with a clear retry action that reuses last attempted task description
- [ ] Implement immediate visible feedback path for successful creates (AC: 1)
  - [ ] Update UI state within 500 ms target under normal conditions by using mutation pending/success transitions
  - [ ] Ensure newly created todo appears in the primary list without requiring manual refresh
- [ ] Add tests for create success/failure and retry behavior (AC: 1, 2)
  - [ ] Frontend tests: pending state on quick-add submit, success path list update, failure path inline error, retry success
  - [ ] Backend contract verification remains via existing `POST /todos` integration tests; extend only if response contract changes

## Dev Notes

### Story Context and Scope

- Story 1.2 already implemented backend create endpoint and validation envelope. Story 1.4 should focus on frontend quick-add UX and mutation handling.
- Story 1.3 already implemented list query and list states. Build on that foundation; do not replace query architecture.
- Keep no-auth MVP constraints and strict API surface (`POST /todos` only for this story).

### Technical Requirements

- Use existing backend endpoint `POST /todos` returning `SuccessResponse[TodoResponse]`.
- Keep API boundary snake_case and frontend domain camelCase via adapter functions.
- Mutation UX must be action-scoped:
  - quick-add submit shows pending state only for create control,
  - list remains interactive and visible,
  - explicit error message includes retry affordance.
- Retry must resubmit the failed create intent without requiring full re-entry.

### Architecture Compliance

- Frontend feature ownership remains under `frontend/src/features/todos/*`.
- Continue TanStack Query for server state; avoid ad hoc `useEffect` synchronization for create flow.
- Preserve clean boundaries:
  - API transport/parsing in `api/*`,
  - query/mutation orchestration in `hooks/*`,
  - view logic in `components/*` and `app/App.tsx` composition.

### Library / Framework Requirements

- Use versions already in project manifests:
  - React `19.2.x`
  - TypeScript `5.9.x`
  - TanStack Query `5.90.x`
  - FastAPI `0.135.1`
  - Pydantic `2.12.5`
- Keep envelope validation guards in API adapter (same defensive approach as `listTodos.ts`).

### File Structure Requirements

- Existing files likely to update:
  - `frontend/src/app/App.tsx`
  - `frontend/src/features/todos/hooks/useTodosQuery.ts` (only if query key extraction/refactor needed)
- New files likely to add:
  - `frontend/src/features/todos/api/createTodo.ts`
  - `frontend/src/features/todos/hooks/useCreateTodoMutation.ts`
  - `frontend/src/features/todos/components/TodoQuickAdd.tsx` (or equivalent project-consistent name)
  - `frontend/src/features/todos/components/TodoQuickAdd.test.tsx`
- Keep naming conventions and folder placement aligned with current Story 1.3 implementation patterns.

### Testing Requirements

- Add focused frontend tests for quick-add behavior:
  - pending indicator/disabled submit while create request is in flight,
  - successful create renders new item in list,
  - failed create shows explicit inline error,
  - retry path re-attempts and resolves correctly.
- Ensure existing tests continue to pass:
  - backend `tests/test_todo_create.py`
  - frontend list tests from Story 1.3.

### Previous Story Intelligence (from 1.3)

- Preserve runtime envelope validation strategy introduced in `listTodos.ts`; do not trust unvalidated JSON shape.
- Preserve safe date rendering fallback added in `TodoList.tsx` (avoid render-time crashes on malformed timestamps).
- Maintain focused story-scoped changes; avoid broad refactors.

### Git Intelligence Summary

- Recent commits indicate a stable pattern: implement story scope, then harden with targeted review fixes.
- Reuse the established todos vertical slice structure rather than introducing parallel abstractions.

### Latest Technical Information

- TanStack Query v5 mutation guidance supports scoped pending/error UI via `useMutation` state and query invalidation, which maps directly to this story’s ACs.
- FastAPI + Pydantic stack in this repo already enforces request validation and standardized error responses for create flows.
- No external web-fetch tools were available in this workflow run; technical guidance is derived from current project-locked versions and architecture artifacts.

### Project Structure Notes

- No `project-context.md` file was discovered; planning artifacts remain the canonical context.
- Quick-add should compose into existing single-screen task list UX from Story 1.3 and not introduce additional pages/routes.

### References

- Story definition: `_bmad-output/planning-artifacts/epics.md` (Epic 1, Story 1.4)
- Architecture constraints and patterns: `_bmad-output/planning-artifacts/architecture.md`
- UX expectations for immediate feedback and scoped errors: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Prior story implementation intelligence: `_bmad-output/implementation-artifacts/1-3-display-task-list-with-loading-and-empty-states.md`

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- Story auto-selected from first backlog item in `sprint-status.yaml`: `1-4-quick-add-task-flow-with-immediate-feedback`.
- Loaded and analyzed epics, architecture, UX spec, and previous story artifact.
- Reviewed current repository code layout and recent git commits for pattern consistency.

### Completion Notes List

- Created comprehensive implementation-ready story guidance for Story 1.4.
- Included architecture, testing, and anti-regression guardrails based on completed Story 1.3 learnings.
- Prepared status transition to `ready-for-dev` in sprint tracking.

### File List

- _bmad-output/implementation-artifacts/1-4-quick-add-task-flow-with-immediate-feedback.md
- _bmad-output/implementation-artifacts/sprint-status.yaml

## Change Log

- 2026-03-06: Story created and status set to `ready-for-dev` with comprehensive dev context.