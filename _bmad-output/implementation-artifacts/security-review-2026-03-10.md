# Security Review Report - 2026-03-10

Story Link: `_bmad-output/implementation-artifacts/5-6-security-review-and-remediation-evidence.md`

## Scope

- Backend API validation, error handling, repository/query patterns, and CORS behavior.
- Frontend rendering paths for user-generated todo descriptions and API error display.
- Container/runtime posture in Compose and Nginx runtime headers.
- Dependency risk posture from backend requirements and frontend lockfile/audit outputs.

## Method

- Static inspection of implementation and configuration files.
- Runtime checks using Docker Compose startup and HTTP probes.
- Deterministic test/audit commands for backend coverage and dependency vulnerability checks.
- Severity model: `high`, `medium`, `low`.

## Inspected Areas

- `backend/app/schemas/todo.py`
- `backend/app/api/error_handlers.py`
- `backend/app/api/routes/todos.py`
- `backend/app/repositories/todo_repository.py`
- `backend/app/core/config.py`
- `backend/app/main.py`
- `frontend/src/features/todos/components/TodoList.tsx`
- `frontend/src/features/todos/components/TodoQuickAdd.tsx`
- `frontend/nginx.conf`
- `docker-compose.yml`
- `backend/requirements.txt`
- `frontend/package.json`

## Findings

| ID | Severity | Category | Affected Files | Evidence | Impact | Disposition | Remediation / Follow-up |
|---|---|---|---|---|---|---|---|
| SEC-001 | medium | Container/runtime posture | `docker-compose.yml`, `backend/Dockerfile` | Initial `docker compose up --build -d` produced unhealthy backend; container command was `python3 -m pytest -q` instead of API runtime command. | Runtime service could execute test-stage command unexpectedly, breaking startup health and reducing deployment reliability/audit confidence. | fixed | Added `target: runtime` under `services.backend.build` in `docker-compose.yml` to force runtime image stage. Verified healthy startup after change. |
| SEC-002 | low | Input validation posture | `backend/app/schemas/todo.py`, `backend/app/api/routes/todos.py` | Pydantic enforces min/max length and strips whitespace; empty/whitespace-only descriptions rejected. Runtime check: POST `/todos` with whitespace returns structured `VALIDATION_ERROR` 400. | Strong baseline validation for todo mutation payloads; residual risk is business-rule scope only. | accepted risk | Continue using schema-first validation for future fields; add explicit format checks if new rich text fields are introduced. |
| SEC-003 | low | Error leakage controls | `backend/app/api/error_handlers.py` | Validation, not-found, and unhandled handlers return sanitized envelopes (`code`, `message`, `details`, `request_id`) and do not expose stack traces. Runtime checks showed sanitized 400/404 payloads. | Low leakage risk in client-facing responses; internal exception details remain server-side. | accepted risk | Keep centralized handlers mandatory for future routes and preserve sanitized message policy. |
| SEC-004 | low | XSS surface | `frontend/src/features/todos/components/TodoList.tsx`, `frontend/src/features/todos/components/TodoQuickAdd.tsx` | Todo descriptions are rendered as React text nodes; no `dangerouslySetInnerHTML` usage found in `frontend/src`. | React default escaping reduces reflected/stored XSS risk for current plain-text todo descriptions. | accepted risk | If rich HTML input is introduced later, require explicit sanitization policy and tests. |
| SEC-005 | low | Injection risks | `backend/app/repositories/todo_repository.py`, `backend/app/api/routes/readiness.py` | Todo data access uses SQLAlchemy ORM query construction; no string-concatenated SQL in CRUD paths. `text("SELECT 1")` used only for fixed readiness probe query. | SQL injection risk is low in current paths; residual risk if raw SQL is added without parameterization. | accepted risk | Follow-up task: add a repository guardrail note/test pattern that prohibits dynamic raw SQL in application CRUD paths. |
| SEC-006 | low | CORS posture | `backend/app/core/config.py`, `backend/app/main.py`, `docker-compose.yml` | Origin allowlist is environment-driven. Runtime checks showed `Access-Control-Allow-Origin: http://localhost:8080` for compose defaults and successful OPTIONS preflight. | Baseline CORS posture is allowlist-based and non-credentialed; risk depends on deployment env values. | accepted risk | Maintain explicit origin allowlists per environment and avoid wildcard origins. |
| SEC-007 | low | Container/runtime headers | `frontend/nginx.conf`, backend runtime responses | Frontend runtime includes `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY`. Backend health response does not currently emit equivalent hardening headers. | Frontend hardening headers present; backend header policy is minimal (acceptable for JSON API but could be improved). | follow-up task | Consider adding lightweight backend response hardening middleware (for example `X-Content-Type-Options`) if policy requires header parity. |
| SEC-008 | low | Dependency risk notes | `backend/requirements.txt`, `frontend/package-lock.json`, `frontend/package.json` | `python3 -m pip_audit -r requirements.txt` returned no known vulnerabilities; `npm audit --omit=dev` returned 0 vulnerabilities. Frontend uses semver ranges (`^`) in `package.json`, while lockfile pins resolved versions. | No currently known production dependency CVEs from executed audits; residual supply-chain drift risk remains for future updates. | accepted risk | Keep lockfiles committed, run `pip_audit` and `npm audit --omit=dev` in CI cadence, and review dependency bumps via PR. |

## Validation Commands And Outcomes

| Command | Outcome | Notes |
|---|---|---|
| `docker compose up --build -d` (pre-fix) | FAIL | Backend unhealthy; logs showed test command execution (`python3 -m pytest -q`) under backend service. |
| `docker compose logs backend --tail=120` (pre-fix) | PASS | Captured failure evidence used by finding `SEC-001`. |
| `docker compose up --build -d` (post-fix) | PASS | Backend and frontend reached healthy status after `target: runtime` remediation. |
| `docker compose ps` | PASS | Verified `backend`, `frontend`, `db` healthy in compose runtime. |
| `curl -sSI http://localhost:8080/` | PASS | Confirmed Nginx security headers (`X-Content-Type-Options`, `X-Frame-Options`). |
| `curl -sS -i -X OPTIONS http://localhost:8000/todos -H 'Origin: http://localhost:8080' -H 'Access-Control-Request-Method: GET'` | PASS | CORS preflight allowed expected origin and methods. |
| `curl -sS -i http://localhost:8000/health -H 'Origin: http://localhost:8080'` | PASS | Simple CORS response included allowed origin. |
| `curl -sS -i -X POST http://localhost:8000/todos -H 'Content-Type: application/json' -d '{"description":"   "}'` | PASS | Returned sanitized `VALIDATION_ERROR` envelope, no stack trace leakage. |
| `curl -sS -i -X PATCH http://localhost:8000/todos/999999 -H 'Content-Type: application/json' -d '{"is_completed":true}'` | PASS | Returned sanitized `NOT_FOUND` envelope with request ID. |
| `cd backend && python3 -m pytest -q --cov=app --cov-report=term-missing --cov-fail-under=70` | PASS | 40 passed, coverage 88.94% (>= 70%), warnings present but non-blocking. |
| `cd frontend && npm audit --omit=dev` | PASS | Found 0 vulnerabilities. |
| `cd backend && python3 -m pip_audit -r requirements.txt` | PASS | No known vulnerabilities found. |

## Traceability

- Story task source: `_bmad-output/implementation-artifacts/5-6-security-review-and-remediation-evidence.md`
- Remediation mapping:
  - `SEC-001` -> `docker-compose.yml` (`services.backend.build.target: runtime`)
- Cross-artifact references updated in:
  - `README.md`
  - `_bmad-output/implementation-artifacts/5-3-qa-infrastructure-and-coverage.md`
  - `_bmad-output/implementation-artifacts/5-5-compose-profiles-and-environment-strategy.md`

## Summary

- High findings: 0
- Medium findings: 1 (`fixed`)
- Low findings: 7 (`accepted risk` or `follow-up task`)
- Overall posture: controls are largely in place; one runtime configuration issue was remediated and verified.
