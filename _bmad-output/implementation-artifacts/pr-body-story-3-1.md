## Summary
Implements Story 3.1 (`Standardized Error Envelope and Client Error Normalization`) and moves the story to `review` with required quality gates passing.

## What changed
- Added a shared frontend mutation-error normalizer:
  - `frontend/src/features/todos/api/normalizeTodoApiError.ts`
  - Extracts user-facing message only from standardized backend envelope:
    - `{ error: { code, message, details, request_id } }`
  - Falls back deterministically to operation-specific defaults for malformed/non-standard payloads.
- Refactored todo mutation adapters to use the shared normalizer while preserving strict success-envelope validation and snake_case→camelCase mapping:
  - `frontend/src/features/todos/api/createTodo.ts`
  - `frontend/src/features/todos/api/updateTodo.ts`
  - `frontend/src/features/todos/api/deleteTodo.ts`
- Extended frontend tests:
  - Added dedicated normalizer coverage in `frontend/src/features/todos/api/normalizeTodoApiError.test.ts`
  - Updated adapter tests to validate standardized-envelope parsing and malformed-body fallback:
    - `frontend/src/features/todos/api/createTodo.test.ts`
    - `frontend/src/features/todos/api/updateTodo.test.ts`
    - `frontend/src/features/todos/api/deleteTodo.test.ts`
- Extended backend mutation error-envelope coverage in:
  - `backend/tests/test_api_error_responses.py`
  - Added checks for deterministic validation/internal-error envelope fields and non-leakage of internal details.
- Updated tracking artifacts:
  - Story file `_bmad-output/implementation-artifacts/3-1-standardized-error-envelope-and-client-error-normalization.md` set to `review`
  - `_bmad-output/implementation-artifacts/sprint-status.yaml` updated to `review` for `3-1-standardized-error-envelope-and-client-error-normalization`

## Validation
- Backend full suite:
  - `python3 -m pytest -q`
  - Result: pass (`17 passed, 5 subtests passed`)
- Frontend focused suite:
  - `npm run test -- src/features/todos/api/createTodo.test.ts src/features/todos/api/updateTodo.test.ts src/features/todos/api/deleteTodo.test.ts src/app/App.test.tsx`
  - Result: pass (`30 passed`)
- Frontend lint:
  - `npm run lint`
  - Result: pass

## Scope
No new dependencies were added. Changes are limited to Story 3.1 error-envelope/normalization behavior, associated tests, and required story/sprint tracking updates.
