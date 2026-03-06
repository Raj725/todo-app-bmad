# Story 2.4: Enforce Actionable Ordering and Status Clarity

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an end user,
I want active and completed tasks clearly separated in priority,
so that I can focus on what to do next.

## Acceptance Criteria

1. Given a mix of active and completed tasks, when the list is rendered, then active tasks are prioritized before completed tasks, and status styling clearly differentiates the two states.
2. Given task states change through complete/incomplete actions, when the UI updates, then items are re-positioned according to ordering rules, and no manual refresh is required.

## Tasks / Subtasks

- [x] Formalize list ordering policy in one place and align rendering to it (AC: 1, 2)
  - [x] Keep active-first ordering as mandatory (`isCompleted=false` before `isCompleted=true`)
  - [x] Keep deterministic secondary sort for same-status items (newest `createdAt` first, then `id` desc fallback)
  - [x] Ensure the same comparator is used for both initial render and post-mutation renders
- [x] Strengthen status clarity in list UI without expanding scope (AC: 1)
  - [x] Preserve explicit text status per item (`Active`/`Completed`) in visible row content
  - [x] Keep status differentiation semantic and not color-only (text/weight cues remain present)
  - [x] Ensure completed-item styling does not reduce readability below baseline
- [x] Verify auto-reposition after toggle mutations without manual refresh (AC: 2)
  - [x] Confirm optimistic update path in `useUpdateTodoMutation` reorders immediately
  - [x] Confirm authoritative refetch path preserves the same order policy after settle
  - [x] Keep per-item pending/error behavior scoped and unchanged from stories 2.1/2.3
- [x] Add/extend frontend tests for ordering and status clarity behavior (AC: 1, 2)
  - [x] Add list/component-level assertions for active-first ordering on mixed data
  - [x] Add app-level assertions that toggling complete↔active repositions rows automatically
  - [x] Add assertions that visible status labels remain clear for both task states
- [x] Run focused quality gates for touched scope (AC: 1, 2)
  - [x] `frontend`: `npm run test -- src/features/todos/components/TodoList.test.tsx src/app/App.test.tsx src/features/todos/hooks/useUpdateTodoMutation.test.ts`
  - [x] `frontend`: `npm run lint`

### Review Follow-ups (AI)

- [x] [AI-Review][HIGH] Rollback path for failed toggle now re-applies actionable ordering after restoring previous todo, preserving immediate active-first consistency [frontend/src/features/todos/hooks/useUpdateTodoMutation.ts]
- [x] [AI-Review][MEDIUM] Toggle failure tracking now uses per-item set state, preventing concurrent failures from overwriting each other [frontend/src/features/todos/hooks/useUpdateTodoMutation.ts, frontend/src/features/todos/components/TodoList.tsx, frontend/src/app/App.tsx]
- [x] [AI-Review][MEDIUM] Story traceability updated with explicit branch-scope note and file list corrections for touched files in this story fix pass [this story record]

## Dev Notes

### Story Context and Scope

- This story finalizes Epic 2 state-clarity behavior after stories 2.1 (toggle), 2.2 (delete), and 2.3 (edit).
- Scope is list ordering + status clarity only; do not add new pages, filters, modals, or visual themes.
- Backend API behavior already supports required state transitions; expected implementation is frontend-dominant.
- FR coverage: FR9, FR10.

### Technical Requirements

- Ordering rule is canonical and deterministic:
  1. Active (`isCompleted=false`) before Completed (`isCompleted=true`)
  2. Within same status: descending `createdAt`
  3. Tie-breaker: descending numeric `id`
- Repositioning must happen immediately after toggle actions via existing optimistic mutation behavior.
- No manual refresh behavior may be introduced or required.
- Keep existing error-envelope handling and mutation retry behaviors unchanged.

### Architecture Compliance

Frontend boundaries (primary touchpoints):
- `frontend/src/features/todos/components/TodoList.tsx` (ordering + status rendering)
- `frontend/src/app/App.tsx` (wiring remains stable)
- `frontend/src/features/todos/hooks/useUpdateTodoMutation.ts` (confirm immediate + settle ordering behavior)
- `frontend/src/app/App.test.tsx` and related frontend tests (behavior coverage)

Backend boundaries:
- No new endpoint/schema/service/repository work is required for this story unless defects are discovered.
- Preserve existing API contracts and error envelope behavior.

### Library / Framework Requirements

Use repository-established stack and versions already in use:
- React `19.2.x`
- TypeScript `5.9.x`
- TanStack Query `5.90.x`
- Vitest + Testing Library for frontend testing

No new dependencies are required.

### File Structure Requirements

Expected files to update:
- `frontend/src/features/todos/components/TodoList.tsx`
- `frontend/src/app/App.test.tsx`

Potentially touched if needed for consistency:
- `frontend/src/features/todos/hooks/useUpdateTodoMutation.ts`
- `frontend/src/features/todos/hooks/useUpdateTodoMutation.test.ts`

### Testing Requirements

Frontend behavior tests should verify:
- Mixed active/completed lists always render active items before completed items.
- Toggling a task between active/completed repositions the item with no manual refresh.
- Status labels remain explicit and understandable in row content for both states.
- Existing edit/delete/toggle scoped pending/error behavior does not regress.

Regression requirements:
- Existing create/list/toggle/delete/edit tests must continue to pass.

### Previous Story Intelligence

From Story 2.3:
- Keep per-item failure tracking with `Set<number>` where applicable; avoid regressing to single-id failure states.
- Maintain in-list interaction model and scoped retry behavior.

From Story 2.2:
- Preserve localized pending behavior; do not introduce global list blocking indicators.
- Keep semantics-first controls (`button`, labels) and keyboard operability.

From Story 2.1:
- Preserve authoritative active-first ordering objective introduced for toggle flow.
- Continue reading and surfacing server error-envelope messages in adapters/hooks.

### Git Intelligence Summary

Recent commit patterns to preserve:
1. `8d899c4` — `fix(story-2.3): resolve code-review findings with per-item failure tracking`
2. `d286043` — `feat(story-2.3): implement in-list task description editing`
3. `b25ce0b` — `Story 2.3: Edit Task Description In-Context`
4. `ed8706e` — `fix(e2e): mock PATCH /todos/:id in Playwright smoke test`
5. `fbc173b` — `feat(story-2.2): resolve review findings and complete delete flow`

Use these conventions as the implementation baseline; avoid introducing parallel patterns.

### Latest Technical Information

- External web research was not executed in this run.
- Guidance is based on repository artifacts and pinned project dependencies.

### Project Structure Notes

- No `project-context.md` was discovered in this repository.
- Canonical guidance sources are planning artifacts in `_bmad-output/planning-artifacts/` and completed implementation artifacts in `_bmad-output/implementation-artifacts/`.

### References

- Story definition: `_bmad-output/planning-artifacts/epics.md` (Epic 2, Story 2.4)
- Architecture constraints: `_bmad-output/planning-artifacts/architecture.md`
- UX requirements: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Previous story learnings: `_bmad-output/implementation-artifacts/2-3-edit-task-description-in-context.md`
- Previous story learnings: `_bmad-output/implementation-artifacts/2-2-delete-task-with-lightweight-confirmation.md`
- Previous story learnings: `_bmad-output/implementation-artifacts/2-1-toggle-task-complete-and-incomplete-from-list.md`

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- Loaded workflow configuration from `_bmad/bmm/config.yaml`, workflow engine from `_bmad/core/tasks/workflow.xml`, and create-story workflow from `_bmad/bmm/workflows/4-implementation/create-story/workflow.yaml`.
- Auto-selected first backlog story from `_bmad-output/implementation-artifacts/sprint-status.yaml`: `2-4-enforce-actionable-ordering-and-status-clarity`.
- Loaded and analyzed: `epics.md`, `architecture.md`, `prd.md`, `ux-design-specification.md`, previous story artifact `2-3-edit-task-description-in-context.md`, and recent git commit history.
- Produced comprehensive story context and implementation guardrails for dev handoff.
- Switched to dedicated branch `feat/2-4-enforce-actionable-ordering-and-status-clarity` before code changes.
- Implemented canonical ordering utility and reused it in list rendering plus update mutation cache writes.
- Added and expanded frontend tests for ordering determinism, status label clarity, and complete↔active auto-reposition behavior.
- Executed focused and full frontend regression gates (`vitest run` and `eslint`).

### Completion Notes List

- ✅ Implemented shared actionable-order comparator (`active` first, then `createdAt` desc, then `id` desc) in a single utility and reused it in both `TodoList` and `useUpdateTodoMutation`.
- ✅ Verified immediate optimistic reposition and consistent settled ordering without manual refresh for toggle mutations.
- ✅ Added component, app, and hook test coverage for mixed ordering, explicit status labels, and complete↔active reposition flows.
- ✅ Ran full frontend regression and lint checks: all tests passing, no lint errors.
- ✅ Resolved review findings by enforcing sorted rollback on toggle failure and replacing single-id toggle failure state with per-item set tracking.
- ✅ Added focused regression tests for rollback ordering and concurrent toggle-failure visibility.
- ℹ️ Branch-level diff includes prior story work; File List below reflects files touched by Story 2.4 implementation and fix pass.
- ℹ️ README impact: none. Changes are internal frontend behavior/test updates and do not alter setup, commands, or API usage.

### File List

- frontend/src/features/todos/orderTodos.ts
- frontend/src/features/todos/components/TodoList.tsx
- frontend/src/features/todos/components/TodoList.test.tsx
- frontend/src/features/todos/hooks/useUpdateTodoMutation.ts
- frontend/src/features/todos/hooks/useUpdateTodoMutation.test.ts
- frontend/src/app/App.tsx
- frontend/src/app/App.test.tsx
- _bmad-output/implementation-artifacts/2-4-enforce-actionable-ordering-and-status-clarity.md
- _bmad-output/implementation-artifacts/sprint-status.yaml

### Change Log

- 2026-03-06: Story created and prepared for implementation handoff.
- 2026-03-06: Implemented canonical actionable ordering in shared utility, applied comparator to list render and update mutation cache paths, and added frontend ordering/status clarity tests; story moved to review.
- 2026-03-06: Senior Developer Review (AI) completed; issues recorded as follow-up tasks and story returned to in-progress.
- 2026-03-06: Applied auto-fix pass for review findings (sorted rollback + per-item toggle failure tracking), updated tests, and completed focused quality gates; story moved to done.

## Senior Developer Review (AI)

Reviewer: Raj
Date: 2026-03-06
Outcome: Approved after fixes

### Summary

- Acceptance Criteria 1 and 2 are largely implemented for happy paths and covered by focused tests.
- One high-severity correctness gap exists in failed toggle rollback ordering behavior.
- Additional medium issues were identified in per-item failure tracking and review traceability.

### Findings

1. [HIGH] Failed toggle rollback does not restore canonical order immediately
  - Evidence: `onError` restores only the previous todo object by id but does not sort the resulting list, so list order can remain inconsistent until refetch settles.
  - Location: `frontend/src/features/todos/hooks/useUpdateTodoMutation.ts` (`onError` cache write)
  - Impact: Violates immediate ordering consistency expectations after failed optimistic toggle.

2. [MEDIUM] Toggle failure state tracks only one id
  - Evidence: `failedTodoId: number | null` in mutation hook and `failedTodoId === todo.id` rendering check in list.
  - Location: `frontend/src/features/todos/hooks/useUpdateTodoMutation.ts`, `frontend/src/features/todos/components/TodoList.tsx`
  - Impact: Concurrent failed toggles can overwrite each other and hide one task’s error state.

3. [MEDIUM] Story file-list traceability mismatch against branch changes
  - Evidence: branch diff includes multiple additional changed files beyond this story file list (`git diff --name-only main...HEAD`).
  - Location: review metadata process
  - Impact: Reduces auditability and can mask cross-story impact during review.

### Resolution

- [Resolved] High and medium code findings were fixed in `useUpdateTodoMutation`, `TodoList`, and app wiring.
- [Resolved] Added regression coverage for rollback ordering correctness and concurrent toggle-failure visibility.
- [Resolved] Story traceability updated with explicit note on branch scope and corrected touched-file list for this story.
