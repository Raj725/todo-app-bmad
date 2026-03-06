# Bugfix: Local Frontend CORS Block

Status: done
Date: 2026-03-06

## Summary

Resolved browser CORS failures when the frontend runs on localhost/127.0.0.1 dev ports and calls backend `/todos` endpoints.

## Acceptance Criteria

- Backend includes CORS middleware with explicit allowed local frontend origins.
- Regression tests validate CORS simple and preflight responses.
- Frontend includes at least one non-mocked browser integration test hitting real backend.
- CI E2E workflow is capable of running the non-mocked integration test.
- Service documentation reflects new CORS configuration and troubleshooting guidance.

## Implementation Notes

- Added configurable backend CORS allow-list via `CORS_ALLOW_ORIGINS`.
- Registered FastAPI `CORSMiddleware` in app startup.
- Added backend integration tests for CORS headers on `GET /todos` and preflight `OPTIONS /todos`.
- Added Playwright E2E test without route interception to validate real browser/backend integration.
- Updated Playwright config to start both frontend and backend web servers during E2E runs.
- Updated CI `frontend-e2e` job to install backend Python dependencies required by backend web server.

## Validation

- Backend focused: `pytest -q tests/test_health_readiness.py` ✅
- Backend full: `pytest -q` ✅
- Frontend unit/integration: `npm run test -- --run` ✅
- Frontend lint: `npm run lint` ✅
- Frontend E2E full: `npm run test:e2e` ✅

## File List

- backend/app/core/config.py
- backend/app/main.py
- backend/tests/test_health_readiness.py
- backend/.env.example
- backend/README.md
- frontend/tests/e2e/todo-smoke.spec.ts
- frontend/playwright.config.ts
- frontend/README.md
- .github/workflows/tests.yml
- README.md

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Notes

- Initial non-mocked E2E failed because Playwright frontend origin (`127.0.0.1:4173`) was not in CORS defaults.
- Expanded default CORS allow-list to include both Vite dev (`5173`) and Playwright (`4173`) localhost/127.0.0.1 origins.

## Change Log

- 2026-03-06: Implemented backend CORS support, added CORS regression tests, added non-mocked frontend E2E integration check, aligned CI and docs.
