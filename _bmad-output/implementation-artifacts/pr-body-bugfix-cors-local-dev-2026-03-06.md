## Summary

Fix local frontend-to-backend CORS blocking in real browser usage and add regression coverage to prevent recurrence.

### What changed

- Added backend CORS middleware wiring in FastAPI startup.
- Added configurable CORS origin allow-list via `CORS_ALLOW_ORIGINS`.
- Expanded default local origins to include dev (`5173`) and Playwright (`4173`) localhost/127.0.0.1 variants.
- Added backend integration tests for CORS simple and preflight behavior.
- Added non-mocked Playwright E2E test hitting a real backend.
- Updated Playwright config to launch backend server during E2E runs.
- Updated CI `frontend-e2e` job to install backend Python dependencies.
- Updated backend/frontend/root docs for env config and troubleshooting.

## Root Cause

Frontend requests were cross-origin (`http://localhost:5173`/`http://127.0.0.1:4173` -> `http://127.0.0.1:8000`) while backend did not emit CORS allow headers, causing browser blocks.

## Validation

- `cd backend && /Users/raj/VSCodeProjects/todo-app-bmad-agile/.venv/bin/python -m pytest -q tests/test_health_readiness.py`
- `cd backend && /Users/raj/VSCodeProjects/todo-app-bmad-agile/.venv/bin/python -m pytest -q`
- `cd frontend && npm run test -- --run`
- `cd frontend && npm run lint`
- `cd frontend && npm run test:e2e`

All passed.

## Files

- `.github/workflows/tests.yml`
- `README.md`
- `backend/.env.example`
- `backend/README.md`
- `backend/app/core/config.py`
- `backend/app/main.py`
- `backend/tests/test_health_readiness.py`
- `frontend/README.md`
- `frontend/playwright.config.ts`
- `frontend/tests/e2e/todo-smoke.spec.ts`
- `_bmad-output/implementation-artifacts/bugfix-cors-local-dev-2026-03-06.md`

## BMAD Artifacts

- Implementation artifact: `_bmad-output/implementation-artifacts/bugfix-cors-local-dev-2026-03-06.md`
- PR body artifact: `_bmad-output/implementation-artifacts/pr-body-bugfix-cors-local-dev-2026-03-06.md`
