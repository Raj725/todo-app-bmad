# Story 2.1: Toggle Task Complete and Incomplete from List

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an end user,
I want to mark tasks complete or active directly in the list,
so that I can track progress without leaving context.

## Acceptance Criteria

1. Given an active task exists, when the user marks it complete, then the task status updates in the UI and backend, and the completed state is visually distinct from active tasks.
2. Given a completed task exists, when the user marks it active again, then the task returns to active state in UI and backend, and ordering rules continue to prioritize actionable tasks.

## Tasks / Subtasks

- [ ] Add backend update capability for completion toggling through existing API boundaries (AC: 1, 2)
  - [ ] Add `PATCH /todos/{todo_id}` route in `backend/app/api/routes/todos.py` using standardized success envelope response model
  - [ ] Add `TodoUpdateRequest` schema in `backend/app/schemas/todo.py` for `is_completed` updates with strict validation
  - [ ] Extend `TodoService` and `TodoRepository` with update-by-id behavior and not-found handling consistent with existing error envelope middleware
- [ ] Add frontend update adapter and mutation hook for in-list toggling (AC: 1, 2)
  - [ ] Add `updateTodo` API function in `frontend/src/features/todos/api/` for `PATCH /todos/{todo_id}` with runtime envelope guards
  - [ ] Add `useUpdateTodoMutation` hook in `frontend/src/features/todos/hooks/` with optimistic toggle, rollback on failure, and list query reconciliation
  - [ ] Keep error handling scoped to affected task action and preserve usability for unaffected items
- [ ] Implement in-list complete/incomplete controls and clear status distinction (AC: 1, 2)
  - [ ] Update `TodoList` row rendering in `frontend/src/features/todos/components/TodoList.tsx` to include a toggle control per item
  - [ ] Add clear visual distinction for completed items (for example label/text style/affordance) without introducing new pages or modal flows
  - [ ] Ensure toggle actions are keyboard-operable and use semantic controls
- [ ] Enforce actionable ordering after state changes (AC: 2)
  - [ ] Update list rendering strategy so active tasks remain prioritized ahead of completed tasks
  - [ ] Ensure ordering remains deterministic after optimistic toggle and authoritative refetch
- [ ] Add/extend tests for complete and uncomplete paths (AC: 1, 2)
  - [ ] Backend tests for `PATCH /todos/{todo_id}` success and validation/not-found behavior
  - [ ] Frontend tests for toggle success, rollback on failure, status styling, and active-first ordering after mutation

## Dev Notes

### Story Context and Scope

- This story builds on the existing create/list foundation from Epic 1 and introduces update semantics specifically for task completion state (`FR3`, `FR4`, `FR26`).
- Scope is in-list interaction only; do not introduce additional navigation surfaces.
- No-auth MVP constraints remain in force.

### Technical Requirements

- API surface must remain minimal and architecture-aligned: implement `PATCH /todos/{todo_id}` for completion-state updates.
- Maintain standardized API response envelopes:
  - success: `{ "data": ... }`
  - error: `{ "error": { "code", "message", "details", "request_id" } }`
- Preserve boundary mapping conventions:
  - backend/API: `is_completed`, `created_at`
  - frontend domain: `isCompleted`, `createdAt`
- Mutation lifecycle requirements:
  1. optimistic UI toggle
  2. rollback on failure
  3. explicit scoped error feedback
  4. authoritative query reconciliation

### Architecture Compliance

- Keep backend boundaries intact:
  - routes in `backend/app/api/routes/`
  - business logic in `backend/app/services/`
  - persistence in `backend/app/repositories/`
- Keep frontend boundaries intact:
  - transport/envelope parsing in `frontend/src/features/todos/api/`
  - mutation orchestration in `frontend/src/features/todos/hooks/`
  - rendering in `frontend/src/features/todos/components/`
- Do not bypass shared error handling patterns already established in backend API handlers.

### Library / Framework Requirements

- Use project-established stack and versions from architecture artifacts:
  - FastAPI `0.135.1`
  - Pydantic `2.12.5`
  - React `19.2.x`
  - TypeScript `5.9.x`
  - TanStack Query `5.90.x`
- No additional dependency should be required for this story.

### File Structure Requirements

- Expected backend files to update:
  - `backend/app/api/routes/todos.py`
  - `backend/app/services/todo_service.py`
  - `backend/app/repositories/todo_repository.py`
  - `backend/app/schemas/todo.py`
  - backend tests under `backend/tests/`
- Expected frontend files to add/update:
  - `frontend/src/features/todos/api/updateTodo.ts` (new)
  - `frontend/src/features/todos/api/updateTodo.test.ts` (new)
  - `frontend/src/features/todos/hooks/useUpdateTodoMutation.ts` (new)
  - `frontend/src/features/todos/components/TodoList.tsx` (update)
  - related frontend tests in `frontend/src/` and/or `frontend/src/features/todos/components/`

### Testing Requirements

- Backend:
  - Add endpoint tests for valid complete/uncomplete transitions.
  - Add negative tests for invalid payload and missing `todo_id`.
- Frontend:
  - Verify toggle control updates item state and visual distinction.
  - Verify rollback and scoped error feedback on failed patch.
  - Verify active-first ordering after toggling between active/completed states.
- Regression:
  - Existing create/list test coverage must continue to pass unchanged.

### Previous Story Intelligence

- No prior story in Epic 2 exists yet; reuse established patterns from Epic 1 artifacts and current codebase conventions.
- Maintain runtime envelope validation in frontend adapters and avoid trusting unvalidated JSON response shape.

### Git Intelligence Summary

- Skipped by workflow condition because this is the first story in Epic 2 (no previous Epic 2 story artifact exists).

### Latest Technical Information

- External web research was not executed in this run.
- Guidance is based on current project architecture artifacts and repository-established versions/patterns.

### Project Structure Notes

- No `project-context.md` file was discovered in the repository.
- Planning artifacts under `_bmad-output/planning-artifacts/` remain the canonical context for this story.

### References

- Story definition: `_bmad-output/planning-artifacts/epics.md` (Epic 2, Story 2.1)
- Product constraints and NFRs: `_bmad-output/planning-artifacts/prd.md`
- Architecture patterns and boundaries: `_bmad-output/planning-artifacts/architecture.md`
- UX requirements for in-list actions and status clarity: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Prior implementation patterns: `_bmad-output/implementation-artifacts/1-4-quick-add-task-flow-with-immediate-feedback.md`

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- Auto-selected first backlog story from `sprint-status.yaml`: `2-1-toggle-task-complete-and-incomplete-from-list`.
- Loaded and analyzed epics, PRD, architecture, UX, and existing implementation artifacts.
- Generated story context file with architecture guardrails and implementation tasks.

### Completion Notes List

- Created comprehensive implementation-ready context for Story 2.1.
- Included backend + frontend work breakdown for completion toggling.
- Included testing guardrails and ordering/status-clarity requirements.

### File List

- _bmad-output/implementation-artifacts/2-1-toggle-task-complete-and-incomplete-from-list.md
- _bmad-output/implementation-artifacts/sprint-status.yaml

## Change Log

- 2026-03-06: Story created and status set to `ready-for-dev`; Epic 2 moved to `in-progress`.