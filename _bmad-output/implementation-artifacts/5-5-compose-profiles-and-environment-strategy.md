# Story 5.5: Compose Profiles and Environment Strategy

Status: done

## Story

As a developer and QA engineer,
I want docker-compose profiles and explicit environment configuration for dev/test,
so that I can run consistent environment-specific workflows.

## Acceptance Criteria

1. `docker-compose.yml` includes clear profile usage for dev/test scenarios.
2. Environment variables are sourced/configured in a profile-aware way instead of only hardcoded values.
3. Developer commands for each profile are documented and reproducible.
4. Existing default local workflow remains straightforward and non-breaking.
5. Compose config validates successfully for all defined profiles.

## Tasks / Subtasks

- [x] Task 1: Introduce explicit compose profile strategy for dev/test while preserving default path (AC: 1, 4)
  - [x] Define profile behavior in `docker-compose.yml` so profile intent is explicit and discoverable.
  - [x] Keep a simple no-profile default workflow for local developer onboarding (`docker compose up --build`).
  - [x] Ensure profiles do not remove current baseline functionality.
- [x] Task 2: Implement profile-aware environment variable sourcing (AC: 2)
  - [x] Add or update root `.env.example` with shared compose-level variables and profile toggles.
  - [x] Move hardcoded compose values to environment-variable references with safe defaults where appropriate.
  - [x] Validate backend/frontend-specific environment documentation remains accurate (`backend/.env.example`, frontend env docs).
- [x] Task 3: Document reproducible profile-specific commands (AC: 3)
  - [x] Update root `README.md` with explicit commands for default, `dev`, and `test` profile usage.
  - [x] Update `backend/README.md` and `frontend/README.md` for any changed environment assumptions.
  - [x] Include expected outcomes and quick troubleshooting for profile mistakes.
- [x] Task 4: Validate compose configuration and run smoke checks (AC: 5)
  - [x] Run `docker compose config` and verify effective configuration.
  - [x] Run `docker compose --profile dev config` and verify profile-resolved configuration.
  - [x] Run `docker compose --profile test config` and verify profile-resolved configuration.
  - [x] Bring up at least one profiled path and run smoke checks (health/readiness and key endpoint reachability).
- [x] Task 5: Keep changes constrained to story scope and avoid regressions (AC: 4)
  - [x] Scope edits to `docker-compose.yml`, env examples/docs, and README updates only.
  - [x] Do not alter API contracts or frontend feature behavior.

## Dev Notes

- Compliance gap context: current compose setup works for baseline but does not explicitly model dev/test profile workflows or profile-oriented environment composition.
- This story is an infrastructure/documentation alignment story in Epic 5 and should remain tightly scoped to compose/env/docs.
- Prior Epic 5 work already established containerization, health checks, and frontend runtime hardening. Build on those patterns rather than replacing them.

### Developer Context Section

This story closes a specification-alignment gap after Stories 5.2-5.4. Existing compose orchestration and health checks are functional, but profile semantics and environment strategy are not explicit. The implementation should add profile clarity and env indirection while preserving the existing default developer path.

Primary outcome:
- Introduce clear, reproducible `dev` and `test` profile workflows.
- Externalize compose configuration through environment variables (`.env`-driven), with documented defaults.
- Preserve no-profile local startup simplicity.

### Technical Requirements

- Add explicit profile usage in `docker-compose.yml` for dev/test scenarios.
- Convert hardcoded values in compose to variable-driven configuration where practical:
  - service ports
  - DB credentials/database name
  - backend `DATABASE_URL` construction
  - frontend build arg/API routing variables as applicable
- Provide profile-aware env examples and docs:
  - root `.env.example` (compose-level source of truth)
  - `backend/.env.example` consistency check and updates if needed
  - frontend env documentation updates if behavior changes
- Keep defaults backwards-compatible for local flows.
- Validation commands are mandatory deliverables in this story:
  - `docker compose config`
  - `docker compose --profile dev config`
  - `docker compose --profile test config`
  - profiled bring-up + smoke checks

### Architecture Compliance

- Preserve service isolation boundaries (frontend, backend, db) and internal network flow.
- Preserve existing health/readiness usage and runtime checks.
- Keep deployment configuration explicit and environment-driven per architecture guidance.
- Align with architecture expectation for separate environment configs (dev/staging/prod style discipline).

[Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment]
[Source: _bmad-output/planning-artifacts/architecture.md#Deployment & QA Strategy (New - Epic 5)]

### Library & Framework Requirements

- Continue using existing Docker/Compose stack (no orchestrator replacement).
- Preserve existing service image baselines unless required for profile/env wiring.
- Do not introduce unrelated runtime dependencies for this story.

[Source: docker-compose.yml]
[Source: _bmad-output/implementation-artifacts/5-2-containerization-and-deployment.md]
[Source: _bmad-output/implementation-artifacts/5-4-frontend-docker-runtime-hardening.md]

### File Structure Requirements

Expected edits:
- `docker-compose.yml`
- `.env.example` (root; create if missing)
- `backend/.env.example` (if needed for parity)
- `README.md`
- `backend/README.md`
- `frontend/README.md`

Do not modify:
- Frontend application source under `frontend/src/`
- Backend API/service implementation under `backend/app/`
- Database schema/migrations

### Testing Requirements

Required validation sequence:

```bash
docker compose config
docker compose --profile dev config
docker compose --profile test config

# smoke-check one profiled path (example: dev)
docker compose --profile dev up --build -d
docker compose --profile dev ps
curl -sSf http://localhost:8080/
curl -sSf http://localhost:8000/health
curl -sSf http://localhost:8000/ready
docker compose --profile dev down
```

If test profile uses alternate ports/variables, adjust curl targets accordingly and document them.

### Previous Story Intelligence

From Story 5.4:
- Keep diffs focused and reviewable.
- Maintain runtime health/proxy behavior while making infra adjustments.
- Keep docs synchronized with operational behavior and validation commands.

From Stories 5.2 and 5.3:
- Container baseline and QA quality-gate discipline are already in place.
- Avoid unnecessary changes outside compose/env/docs.

[Source: _bmad-output/implementation-artifacts/5-2-containerization-and-deployment.md]
[Source: _bmad-output/implementation-artifacts/5-3-qa-infrastructure-and-coverage.md]
[Source: _bmad-output/implementation-artifacts/5-4-frontend-docker-runtime-hardening.md]

### Git Intelligence Summary

Recent commit patterns indicate a preference for:
- small scoped infrastructure changes,
- explicit verification evidence in story records,
- and follow-up review fixes captured quickly.

Recent commits (latest first):
- `29a5b17` fix(review): apply code review feedback for story 5.4
- `aadd17d` feat(5-4-frontend-docker-runtime-hardening): harden frontend runtime and add healthcheck
- `9b4392e` chore: update gitignore for coverage and playwright artifacts
- `b623d8a` fix(e2e): clean stale todos before CRUD lifecycle test
- `81e5a51` fix(review): apply code review feedback for story 5.3

### Latest Tech Information

- Docker Compose profiles are additive selectors that can coexist with a default workflow; profile-specific behavior should be explicit in docs and config.
- Compose environment-variable substitution (`${VAR}` with optional defaults) remains the preferred pattern for portable, environment-specific stack configuration.
- `docker compose ... config` is the canonical validation method for resolved compose state before runtime.

### Project Structure Notes

- Story scope is deployment configuration and documentation only.
- Preserve architecture boundaries and existing product behavior.
- Include implementation notes that help future stories reuse the profile/env strategy.

### References

- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/implementation-artifacts/5-2-containerization-and-deployment.md`
- `_bmad-output/implementation-artifacts/5-3-qa-infrastructure-and-coverage.md`
- `_bmad-output/implementation-artifacts/5-4-frontend-docker-runtime-hardening.md`
- `docker-compose.yml`
- `README.md`
- `backend/README.md`
- `frontend/README.md`
- `backend/.env.example`

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- Story created via BMAD `create-story` workflow execution with explicit user-selected target: Epic 5, Story 5.5.
- Updated sprint tracking to `in-progress` before implementation and progressed to `review` after validation.

### Completion Notes List

- Implemented profile-aware compose strategy with explicit `dev` and `test` profile services while preserving the no-profile default startup path.
- Replaced hardcoded compose values with environment-variable references and safe defaults for ports, DB settings, `DATABASE_URL`, CORS, and frontend build-time API URL.
- Added root `.env.example` as compose-level source of truth for profile toggles and shared runtime values.
- Updated `README.md`, `backend/README.md`, and `frontend/README.md` with profile workflows, validation commands, and troubleshooting guidance.
- Confirmed backend/frontend env documentation remains aligned with compose behavior; no `backend/.env.example` content changes were required.
- Validation commands executed:
  - `docker compose config` (PASS)
  - `docker compose --profile dev config` (PASS)
  - `docker compose --profile test config` (PASS)
  - `docker compose --profile dev up --build -d` (PASS)
  - `docker compose --profile dev ps` (PASS; `db`, `backend`, `frontend` healthy)
  - `curl -sSf http://localhost:8080/` (PASS)
  - `curl -sSf http://localhost:8000/health` (PASS)
  - `curl -sSf http://localhost:8000/ready` (PASS)
  - `docker compose --profile dev down` (PASS)
  - `cd frontend && npm run lint` (PASS with warnings only; no errors)
  - `cd frontend && npm run test` (PASS)
  - `cd frontend && npm run test:e2e` (PASS)
  - `cd backend && python3 -m pytest -q` (PASS)

### File List

- `.env.example`
- `docker-compose.yml`
- `backend/Dockerfile`
- `README.md`
- `backend/README.md`
- `frontend/README.md`
- `_bmad-output/implementation-artifacts/5-5-compose-profiles-and-environment-strategy.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-03-10: Implemented compose profile/environment strategy for Story 5.5, added compose-level `.env.example`, updated docs for default/dev/test workflows, and validated compose plus FE/BE quality gates.
- 2026-03-10: Code review fixes applied:
  - [H1] Added `test` build stage to `backend/Dockerfile` installing `requirements-dev.txt` so `backend-test-gate` can actually run pytest (was broken: `ModuleNotFoundError`).
  - [H1] Added `chown -R app:app /app` in test stage so tests can create temp SQLite DBs.
  - [H1] Added `target: test` to `backend-test-gate` compose service to use the new stage.
  - [M1] Verified test profile runtime end-to-end: `docker compose --profile test up --build backend-test-gate` → 40 passed.
  - [M2] Extracted `x-backend-env` YAML extension field with anchor to DRY backend/test-gate environment blocks.
  - [M3] Added `/ready` endpoint check to `compose-dev-check` service.
  - [M4] Added shared-volume isolation warning to README test profile section.
  - [L1] Changed `sh -lc` to `sh -c` in `compose-dev-check`.
  - [L2] Removed unnecessary `CORS_ALLOW_ORIGINS` from `backend-test-gate`.
- 2026-03-10: Added security review evidence reference: `_bmad-output/implementation-artifacts/security-review-2026-03-10.md`.

## Story Completion Status

- Story implementation completed and validated.
- Status set to `done`.
- Compose profile/environment compliance gap closed with scoped configuration and documentation updates.

## Senior Developer Review (AI)

**Reviewer:** Raj on 2026-03-10

**Findings (7 total): 1 High, 4 Medium, 2 Low — all fixed.**

| # | Severity | Finding | Fix |
|---|----------|---------|-----|
| H1 | HIGH | `backend-test-gate` broken: pytest not in Docker image, /app not writable | Added `test` Dockerfile stage with dev deps + chown; compose uses `target: test` |
| M1 | MEDIUM | Test profile never runtime-tested (only `config` validated) | Verified: 40 passed, 0 errors via `docker compose --profile test up --build backend-test-gate` |
| M2 | MEDIUM | Duplicated env block creates drift risk | Extracted `x-backend-env` YAML extension with anchor |
| M3 | MEDIUM | `compose-dev-check` omits `/ready` endpoint | Added `curl -fsS http://backend:8000/ready` to command |
| M4 | MEDIUM | Test profile shares prod DB volume without warning | Added isolation note to README test profile section |
| L1 | LOW | `compose-dev-check` uses unnecessary login shell (`sh -lc`) | Changed to `sh -c` |
| L2 | LOW | `CORS_ALLOW_ORIGINS` unnecessary in test-gate | Removed from test-gate env block |

**Quality Gates:**
- `docker compose config` (default/dev/test): PASS
- `docker compose --profile test up --build backend-test-gate`: 40 passed
- `cd backend && python3 -m pytest -q`: 40 passed

**Outcome: Approved** — all issues fixed, all ACs implemented, quality gates green.
