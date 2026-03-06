# Story 3.1: Standardized Error Envelope and Client Error Normalization

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an end user,
I want clear and consistent error messages,
so that I understand what failed and what to do next.

## Acceptance Criteria

1. Given any failed task mutation request, when the API returns an error, then the response follows a standardized machine-readable error envelope, and no stack traces or internal implementation details are exposed.
2. Given a standardized error response is received by the frontend, when it is processed, then a normalized, user-readable message is shown inline, and the message is scoped to the affected action.

## Tasks / Subtasks

- [x] Audit and enforce backend mutation error-envelope consistency (AC: 1)
  - [x] Confirm all mutation endpoints (`POST /todos`, `PATCH /todos/{todo_id}`, `DELETE /todos/{todo_id}`) return the standard `{ error: { code, message, details, request_id } }` on failure paths.
  - [x] Keep `400` validation, `404` not-found, and `500` unexpected-error mapping stable and deterministic.
  - [x] Ensure internal exceptions remain server-logged only and never leak implementation details to clients.
- [x] Introduce a single frontend error-normalization utility for todo API calls (AC: 2)
  - [x] Create shared parser/helper to read error envelopes and derive user-facing fallback messages.
  - [x] Replace duplicated per-file error extraction logic in mutation API adapters with shared normalizer.
  - [x] Preserve existing success-envelope validation behavior and snake_case→camelCase mapping.
- [x] Wire normalized error output to scoped UI action feedback (AC: 2)
  - [x] Ensure create errors remain tied to quick-add flow, and update/delete errors remain tied to affected item/action.
  - [x] Keep pending/error state isolation so one failed action does not globally block unrelated task interactions.
- [x] Add/extend tests for envelope guarantees and normalization behavior (AC: 1, 2)
  - [x] Backend tests: validation/not-found/internal-error envelope fields and absence of stack traces.
  - [x] Frontend tests: shared normalizer behavior for valid envelope, malformed body fallback, and adapter usage in create/update/delete.
  - [x] App/interaction tests: inline error visibility remains scoped to relevant action context.
- [x] Run focused quality gates (AC: 1, 2)
  - [x] `backend`: `python3 -m pytest -q`
  - [x] `frontend`: `npm run test -- src/features/todos/api/createTodo.test.ts src/features/todos/api/updateTodo.test.ts src/features/todos/api/deleteTodo.test.ts src/app/App.test.tsx`
  - [x] `frontend`: `npm run lint`

## Dev Notes

### Story Context and Scope

- This is the first story in Epic 3 (trustworthy action outcomes). It establishes the shared error-contract baseline before optimistic lifecycle/retry/reconciliation stories (3.2–3.4).
- Existing code already contains partial envelope handling; implementation should standardize and centralize, not re-implement parallel patterns.
- Scope is error-contract + client normalization only. Do not add new UI pages, modals, or feature expansions.
- FR coverage: FR13, FR16, FR28.

### Technical Requirements

- Backend failure envelope must remain machine-readable and stable:
  - Shape: `{ "error": { "code": string, "message": string, "details": array, "request_id": string } }`
  - Status mapping: `400` validation, `404` not found, `500` internal
  - No stack traces or internal exception payload leakage in client response bodies.
- Frontend must normalize mutation errors from a single utility and surface readable messages for affected actions.
- Keep API success-envelope checks strict (`{ data: ... }`) and retain existing type guards.
- No change to endpoint surface area (`/todos`, `/health`, `/ready`).

### Architecture Compliance

Backend boundaries (primary touchpoints):
- `backend/app/api/error_handlers.py`
- `backend/app/api/schemas/error.py`
- `backend/app/main.py`
- `backend/app/api/routes/todos.py`
- `backend/tests/test_api_error_responses.py`
- `backend/tests/test_todo_create.py`
- `backend/tests/test_todo_delete.py`

Frontend boundaries (primary touchpoints):
- `frontend/src/features/todos/api/createTodo.ts`
- `frontend/src/features/todos/api/updateTodo.ts`
- `frontend/src/features/todos/api/deleteTodo.ts`
- `frontend/src/features/todos/hooks/useCreateTodoMutation.ts`
- `frontend/src/features/todos/hooks/useUpdateTodoMutation.ts`
- `frontend/src/features/todos/hooks/useDeleteTodoMutation.ts`
- `frontend/src/app/App.tsx`

Recommended new shared helper location:
- `frontend/src/features/todos/api/normalizeTodoApiError.ts`

### Library / Framework Requirements

Use the repository-established stack and currently pinned major versions:
- FastAPI `0.135.x`
- Pydantic `2.12.x`
- React `19.2.x`
- TypeScript `5.9.x`
- TanStack Query `5.90.x`
- Pytest (backend) and Vitest + Testing Library (frontend)

No new dependencies are required.

### File Structure Requirements

- Keep backend layering intact: routes call services, error handlers stay centralized.
- Keep frontend API concerns in `features/todos/api/*`; avoid scattering error parsing across hooks/components.
- Prefer adding one focused normalizer file and reusing it from mutation adapters.

### Testing Requirements

Backend expectations:
- Mutation validation failures return `VALIDATION_ERROR` envelope with `request_id` and list `details`.
- Not-found mutation failures return `NOT_FOUND` envelope with safe message and no internals.
- Unhandled failures return `INTERNAL_SERVER_ERROR` envelope with generic message and empty `details`.

Frontend expectations:
- Shared normalizer extracts `error.message` when envelope is valid.
- Shared normalizer falls back to operation-specific generic message for malformed/non-JSON error bodies.
- `createTodo`, `updateTodo`, and `deleteTodo` use the shared normalizer consistently.

Regression expectations:
- Existing optimistic pending/error UI behavior remains scoped and non-blocking.
- Existing CRUD happy-path tests continue to pass.

### Latest Technical Information

- External web research was not executed in this run.
- Guidance is based on repository artifacts and current in-repo dependencies.

### Project Structure Notes

- No `project-context.md` was discovered in this repository.
- Canonical guidance sources are `_bmad-output/planning-artifacts/` and completed implementation artifacts.

### References

- Story definition: `_bmad-output/planning-artifacts/epics.md` (Epic 3, Story 3.1)
- PRD reliability/error requirements: `_bmad-output/planning-artifacts/prd.md` (FR13, FR16, FR28; NFR8, NFR9)
- Architecture error/envelope patterns: `_bmad-output/planning-artifacts/architecture.md` (API Response Formats, Error Handling Patterns, Enforcement Guidelines)
- UX feedback/scoped-error expectations: `_bmad-output/planning-artifacts/ux-design-specification.md` (Journey 2, Feedback Patterns)

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Implementation Plan

- Add a shared frontend mutation-error normalizer that accepts unknown response payloads and deterministic fallback messages.
- Refactor create/update/delete todo mutation adapters to reuse the normalizer while preserving strict success-envelope validation.
- Extend backend mutation-error integration tests for validation and internal-error envelope consistency and non-leakage.
- Extend frontend adapter tests and add dedicated normalizer unit tests.
- Execute story-required backend/frontend quality gates and update story tracking artifacts.

### Debug Log References

- Loaded BMAD module config from `_bmad/bmm/config.yaml` and resolved workflow variables.
- Loaded workflow engine from `_bmad/core/tasks/workflow.xml` and create-story workflow from `_bmad/bmm/workflows/4-implementation/create-story/workflow.yaml`.
- Auto-selected first backlog story from `_bmad-output/implementation-artifacts/sprint-status.yaml`: `3-1-standardized-error-envelope-and-client-error-normalization`.
- Updated epic lifecycle state for first epic story creation: `epic-3` backlog → in-progress.
- Loaded and analyzed planning artifacts: `epics.md`, `architecture.md`, `prd.md`, `ux-design-specification.md`.
- Inspected current backend/frontend code and tests for existing envelope and error-message patterns before composing implementation guardrails.
- Switched to implementation branch `feat/3-1-standardized-error-envelope-and-client-error-normalization` and set sprint story status to `in-progress`.
- Added red-phase frontend tests for shared error normalization and create mutation envelope parsing behavior.
- Implemented `normalizeTodoApiError` and refactored `createTodo`, `updateTodo`, and `deleteTodo` to use centralized error normalization.
- Extended backend mutation-error tests for delete validation envelopes and create internal-error non-leakage assertions.
- Executed focused frontend tests, focused backend error tests, full backend test suite, and frontend lint successfully.

### Completion Notes List

- ✅ Story context created with explicit acceptance criteria, guardrails, and implementation boundaries for Epic 3 Story 3.1.
- ✅ Technical requirements include strict backend error-envelope contract and frontend shared normalization strategy.
- ✅ File-level recommendations are aligned to current repository structure and existing API/hook patterns.
- ✅ Focused test and validation commands are provided for implementation and review handoff.
- ✅ Added shared mutation error normalizer to centralize envelope parsing and fallback behavior in frontend API adapters.
- ✅ Updated create/update/delete adapters to consistently normalize standardized backend error envelopes.
- ✅ Added backend mutation-envelope tests covering validation and internal-error guarantees without leaking implementation details.
- ✅ Added frontend tests for normalizer utility and adapter behavior with standardized envelopes and malformed-body fallback.
- ✅ Quality gates passed: `python3 -m pytest -q`, focused frontend Vitest suite, and `npm run lint`.
- ✅ No README impact for this story; service commands and usage remain unchanged.

### File List

- _bmad-output/implementation-artifacts/3-1-standardized-error-envelope-and-client-error-normalization.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- backend/tests/test_api_error_responses.py
- frontend/src/features/todos/api/normalizeTodoApiError.ts
- frontend/src/features/todos/api/normalizeTodoApiError.test.ts
- frontend/src/features/todos/api/createTodo.ts
- frontend/src/features/todos/api/updateTodo.ts
- frontend/src/features/todos/api/deleteTodo.ts
- frontend/src/features/todos/api/createTodo.test.ts
- frontend/src/features/todos/api/updateTodo.test.ts
- frontend/src/features/todos/api/deleteTodo.test.ts

### Change Log

- 2026-03-06: Story created and prepared for implementation handoff (`ready-for-dev`).
- 2026-03-06: Implemented standardized mutation error normalization across frontend adapters and extended backend/frontend envelope test coverage; quality gates passed and story moved to `review`.
