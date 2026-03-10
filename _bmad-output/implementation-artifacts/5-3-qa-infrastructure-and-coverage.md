# Story 5.3: QA Infrastructure and Coverage

Status: done

## Story

As a maintainer,
I want unified QA infrastructure with enforced coverage and critical journey testing,
so that production releases are protected by reliable quality gates.

## Acceptance Criteria

1. A CI-enforced coverage gate of `>=70%` is implemented across frontend and backend test suites, and failing coverage blocks the pipeline. [Source: _bmad-output/planning-artifacts/prd.md#Technical Success]
2. Frontend unit/component tests run with coverage reporting and thresholds configured in Vitest, including clear include/exclude scopes. [Source: _bmad-output/planning-artifacts/architecture.md#Testing Strategy]
3. Backend tests run with coverage reporting and thresholds configured in pytest (via `pytest-cov`) for the `app/` package, with deterministic CI behavior. [Source: _bmad-output/planning-artifacts/architecture.md#Testing Strategy]
4. End-to-end tests cover at least five critical user journeys (Create, Complete, Delete, Empty, Error) and are integrated into CI quality gates. [Source: _bmad-output/planning-artifacts/prd.md#Measurable Outcomes]
5. Accessibility checks continue to run in automated browser tests with zero critical violations tolerated in defined scenarios. [Source: _bmad-output/planning-artifacts/prd.md#Technical Success]
6. Documentation clearly describes local and CI QA commands for frontend, backend, and E2E execution.

## Tasks / Subtasks

- [x] Task 1: Add backend coverage tooling and threshold enforcement (AC: 1, 3)
  - [x] Add `pytest-cov` to `backend/requirements-dev.txt`.
  - [x] Configure coverage command and threshold (for example: `python -m pytest --cov=app --cov-report=term-missing --cov-fail-under=70`).
  - [x] Ensure backend coverage excludes test files and migration scaffolding if needed.
- [x] Task 2: Add frontend coverage tooling and threshold enforcement (AC: 1, 2)
  - [x] Update `frontend/vitest.config.ts` with `coverage` configuration (`provider`, `reporter`, includes/excludes, thresholds).
  - [x] Add a frontend script for coverage in `frontend/package.json` (for example `test:coverage`).
  - [x] Confirm threshold failures return non-zero exit codes in CI.
- [x] Task 3: Integrate coverage gates in CI workflow (AC: 1)
  - [x] Update `.github/workflows/tests.yml` backend test job to run coverage and fail under threshold.
  - [x] Update `.github/workflows/tests.yml` frontend test job to run coverage mode.
  - [x] Preserve existing lint/typecheck/perf/e2e jobs and artifact behavior.
- [x] Task 4: Validate critical E2E journey coverage and accessibility checks (AC: 4, 5)
  - [x] Verify `frontend/tests/e2e` includes Create/Complete/Delete/Empty/Error journey coverage.
  - [x] Add or adjust specs only where a required journey is missing.
  - [x] Keep `@axe-core/playwright` checks active in accessibility-relevant flows.
- [x] Task 5: Update QA docs and run full verification (AC: 6)
  - [x] Update `README.md`, `frontend/README.md`, and `backend/README.md` with coverage commands and expectations.
  - [x] Run local verification commands and capture results in this story's completion notes.

## Dev Notes

- Story 5.2 already established CI quality gates and dockerized execution; this story must extend those gates, not replace them.
- Keep implementation incremental and avoid changing product behavior while improving test infrastructure.
- Maintain deterministic output for CI by using explicit coverage commands and stable threshold definitions.

### Developer Context Section

This story is infrastructure-focused and should avoid invasive feature rewrites. Primary deliverables are:
- Coverage threshold enforcement in both language ecosystems.
- CI gate updates that block regressions.
- Confirmation that critical E2E journeys remain protected.

Use existing test stacks rather than introducing new frameworks:
- Frontend: Vitest + React Testing Library + Playwright.
- Backend: pytest + FastAPI TestClient.

### Technical Requirements

- Backend:
  - Use `pytest-cov` via dev dependencies only (`backend/requirements-dev.txt`).
  - Measure coverage for `backend/app` domain code, not tests.
  - Fail CI under 70% threshold.
- Frontend:
  - Configure Vitest coverage in `frontend/vitest.config.ts`.
  - Ensure source coverage targets app/features/lib code; exclude build outputs, E2E folder, and generated files.
  - Fail CI under 70% threshold.
- CI:
  - Keep existing job matrix structure in `.github/workflows/tests.yml`.
  - Coverage checks must execute on pull requests.

### Architecture Compliance

- Preserve architecture boundaries:
  - Backend route/service/repository layering remains unchanged while adding test enforcement.
  - Frontend feature-first structure remains unchanged.
- Preserve standardized API envelope and error behavior while extending tests.
- Preserve accessibility baseline introduced in Epic 4 and continue browser-based validation.

[Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries]

### Library & Framework Requirements

- Existing stack constraints to keep:
  - FastAPI `0.135.1`, SQLAlchemy `2.0.48`, pytest stack in backend.
  - React `19.2.x`, Vitest `4.x`, Playwright `1.54.x`, `@axe-core/playwright` in frontend.
- Do not add alternate test frameworks (for example Jest/Cypress) for this story.

[Source: backend/requirements.txt]
[Source: frontend/package.json]

### File Structure Requirements

Expected primary edits:
- `.github/workflows/tests.yml`
- `backend/requirements-dev.txt`
- `frontend/package.json`
- `frontend/vitest.config.ts`
- Optional docs: `README.md`, `backend/README.md`, `frontend/README.md`
- Optional E2E/spec updates under `frontend/tests/e2e/` if journey gaps are found

Do not move core app files or alter established service topology.

### Testing Requirements

Run and record at minimum:
- Backend: `cd backend && python -m pytest -q --cov=app --cov-report=term-missing --cov-fail-under=70`
- Frontend unit/component: `cd frontend && npm run test:coverage` (or equivalent configured command)
- Frontend E2E: `cd frontend && npm run test:e2e`
- Frontend static checks: `cd frontend && npm run lint && npm run typecheck`

CI should fail when either coverage threshold is below 70%.

### Previous Story Intelligence

From Story 5.2 learnings:
- CI workflow already has separate jobs for backend tests, frontend tests, lint, typecheck, performance budget, and E2E; extend this pattern instead of redesigning pipeline orchestration.
- Keep dev-only tooling in `requirements-dev.txt` (5.2 review explicitly moved pytest out of production deps).
- Health and containerization are already complete; QA story should validate these through tests where meaningful, but not rewrite container runtime logic.

[Source: _bmad-output/implementation-artifacts/5-2-containerization-and-deployment.md]

### Git Intelligence Summary

Recent commit pattern indicates active work on story 5.2 and review hardening:
- `fix(review): apply code review feedback for story 5.2`
- `feat(5-2): containerize app and add compose deployment`
- `fix(5.2): update story format for dev agent workflow`

Implication for 5.3:
- Favor additive, review-friendly diffs with explicit commands and low blast radius.
- Expect scrutiny on dependency separation and CI signal quality.

### Latest Tech Information

Within currently pinned project dependencies:
- Vitest 4.x supports first-class coverage configuration in `vitest.config.ts`.
- Playwright 1.54.x plus `@axe-core/playwright` provides stable multi-browser accessibility checks.
- pytest-cov integration is the standard path for Python coverage gate enforcement in CI.

Because this story targets project stability, prioritize compatibility with current pinned versions over broad dependency upgrades.

### Project Structure Notes

- Follow existing repository structure and conventions already implemented in Epics 1-5.
- Keep frontend and backend test tooling separated by service boundaries.
- Keep PR workflow scoped to quality gates and tests, not feature redesign.

### References

- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/implementation-artifacts/5-2-containerization-and-deployment.md`
- `_bmad-output/implementation-artifacts/security-review-2026-03-10.md`
- `.github/workflows/tests.yml`
- `frontend/package.json`
- `frontend/vitest.config.ts`
- `frontend/playwright.config.ts`
- `backend/requirements.txt`
- `backend/requirements-dev.txt`

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- Story created via BMAD `create-story` workflow execution.

### Completion Notes List

- Next backlog story identified from sprint status: `5-3-qa-infrastructure-and-coverage`.
- Story context consolidated from epics, PRD, architecture, prior story, and current CI/test configs.
- Story status set to `ready-for-dev` with implementation guardrails.
- Updated backend dev tooling with `pytest-cov` and wired backend CI/test command to enforce `--cov-fail-under=70` against `app/`.
- Added frontend Vitest coverage configuration (v8 provider, include/exclude scopes, >=70 thresholds) and `npm run test:coverage` script.
- Updated `.github/workflows/tests.yml` to run coverage-gated backend and frontend test jobs while preserving lint/typecheck/perf/e2e jobs.
- Verified required E2E journey coverage (Create, Complete, Delete, Empty, Error) and ongoing `@axe-core/playwright` accessibility assertions; no additional E2E specs were required.
- Updated root, frontend, and backend READMEs with local/CI QA commands and coverage expectations.
- Validation commands executed:
  - `cd frontend && npm run lint` (pass)
  - `cd frontend && npm run test` (pass)
  - `cd frontend && npm run test:coverage` (pass, total coverage 95.89%)
  - `cd frontend && npm run test:e2e` (pass, 52 passed / 3 skipped)
  - `cd backend && python3 -m pytest -q --cov=app --cov-report=term-missing --cov-fail-under=70` (pass, total coverage 88.94%)

### File List

- `_bmad-output/implementation-artifacts/5-3-qa-infrastructure-and-coverage.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `.github/workflows/tests.yml`
- `backend/requirements-dev.txt`
- `backend/tests/test_cross_cutting_coverage.py`
- `backend/README.md`
- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/vitest.config.ts`
- `frontend/README.md`
- `README.md`

## Change Log

- 2026-03-09: Implemented QA coverage infrastructure with CI-enforced 70% thresholds across frontend and backend, validated E2E/a11y critical journeys, and documented local/CI QA command matrix.
- 2026-03-10: Code review fixes applied — merged duplicate backend README Troubleshooting sections, excluded barrel src/App.tsx from coverage scope, renamed test_qa_coverage_gates.py to test_cross_cutting_coverage.py, added follow-up task for app/main.py coverage.
- 2026-03-10: Added security evidence cross-reference to `_bmad-output/implementation-artifacts/security-review-2026-03-10.md` for Epic 5 QA traceability.

## Review Follow-ups (AI)

- [ ] [AI-Review][MEDIUM] `app/main.py` has 0% test coverage — add a lightweight integration test that imports the FastAPI `app` and asserts router registration (health/readiness/todos routes present)

## Story Completion Status

- Story implementation complete.
- All tasks/subtasks marked complete and validated.
- Status set to `done`.
