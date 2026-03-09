# Story 5.2: Containerization and Deployment

## Story Context
**Epic:** 5 - Production Readiness & Quality Gates
**Story:** 5.2 - Containerization and Deployment
**Status:** done

## User Story
**As a** DevOps Engineer / Developer
**I want** to containerize the frontend and backend services using Docker and orchestrate them with Docker Compose
**So that** I can deploy the application consistently across development, testing, and production environments with zero "works on my machine" issues.

## Acceptance Criteria

### 1. Backend Containerization
- [ ] Create `backend/Dockerfile` using `python:3.11-slim` or similar lightweight base image.
- [ ] Implement multi-stage build to minimize image size (build vs runtime).
- [ ] Run application as a **non-root user** for security.
- [ ] Expose port 8000.
- [ ] Include health check instruction in Dockerfile or Compose.
- [ ] Verify `uvicorn` starts successfully within the container.

### 2. Frontend Containerization
- [ ] Create `frontend/Dockerfile` using `node:20-alpine` (or similar).
- [ ] Implement multi-stage build:
    - Stage 1: Build (install dependencies, run `npm run build`).
    - Stage 2: Serve (use `nginx:alpine` to serve static files).
- [ ] Configure Nginx to handle SPA routing (redirect 404s to `index.html`).
- [ ] Run Nginx as non-root user if possible (or standard nginx user).
- [ ] Expose port 80.

### 3. Orchestration with Docker Compose
- [ ] Create `docker-compose.yml` in the project root.
- [ ] Define services:
    - `backend`: Maps port 8000:8000.
    - `frontend`: Maps port 8080:80 (so localhost:8080 loads the app).
    - `db` (PostgreSQL): Use official image, persist data with volume.
- [ ] Configure networking so `frontend` (browser-side) can talk to `backend` (API).
    - *Note:* Since the Frontend is SPA, it runs in the *browser*. Nginx usually needs to reverse-proxy `/api` requests to the backend service.
    - **Crucial:** Implement Nginx reverse proxy config in `frontend/nginx.conf` (or similar) to forward `/api` requests to `http://backend:8000`.
- [ ] Define environment variables for database connection strings.

### 4. Health Checks
- [ ] Services must implement health checks:
    - Backend: `/health` endpoint returning 200 OK.
    - PostgreSql: `pg_isready`.
- [ ] `docker-compose ps` should show "healthy" status for all services.

### 5. Developer Experience
- [ ] `docker-compose up` (or `up --build`) successfully starts the full stack.
- [ ] Application is accessible at `http://localhost:8080`.
- [ ] API docs accessible at `http://localhost:8000/docs` (or via proxy).

## Implementation Guides

### Backend Dockerfile Pattern
```dockerfile
# Build stage
FROM python:3.11-slim as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user -r requirements.txt

# Runtime stage
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH
# Create non-root user
RUN adduser --disabled-password appuser
USER appuser
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]
```

### Frontend Dockerfile Pattern
```dockerfile
# Build Stage
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production Stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Copy custom nginx config for SPA + Proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Technical Notes
- Ensure `.dockerignore` files are created for both frontend and backend to exclude `node_modules`, `__pycache__`, `.venv`, etc.
- Database URL in backend needs to point to the docker service name (e.g., `postgresql://user:pass@db:5432/dbname`).

## Tasks

### Backend Containerization
- [x] Create `backend/Dockerfile` using `python:3.11-slim` or similar lightweight base image.
    - [x] Implement multi-stage build to minimize image size (build vs runtime).
    - [x] Run application as a **non-root user** for security.
    - [x] Expose port 8000.
    - [x] Include health check instruction in Dockerfile or Compose.
    - [x] Verify `uvicorn` starts successfully within the container. (e.g., `docker run -p 8000:8000 backend_image`)
    - [x] Create `.dockerignore` for backend (exclude `.venv`, `__pycache__`, etc.)

### Frontend Containerization
- [x] Create `frontend/Dockerfile` using `node:20-alpine` (or similar).
    - [x] Implement multi-stage build: Stage 1 Build (npm ci, npm run build), Stage 2 Serve (nginx:alpine).
    - [x] Configure Nginx to handle SPA routing (redirect 404s to `index.html`) using a custom `nginx.conf`.
    - [x] Run Nginx as non-root user if possible (or standard nginx user).
    - [x] Expose port 80.
    - [x] Create `.dockerignore` for frontend (exclude `node_modules`, `dist`, etc.)

### Orchestration with Docker Compose
- [x] Create `docker-compose.yml` in the project root.
    - [x] Define `backend` service: Maps port 8000:8000.
    - [x] Define `frontend` service: Maps port 8080:80.
    - [x] Define `db` service (PostgreSQL): Persist data with volume.
- [x] Configure networking so `frontend` (browser-side) can talk to `backend` (API).
    - [x] Implement Nginx reverse proxy config in `frontend/nginx.conf` to forward `/api` requests to `http://backend:8000`.
- [x] Define environment variables for database connection strings.

### Verification & Health Checks
- [x] Implement health checks for services.
    - [x] Backend: `/health` endpoint returning 200 OK.
    - [x] PostgreSql: `pg_isready`.
- [x] Verify `docker-compose up` starts the full stack successfully.
- [x] Verify `docker-compose ps` shows "healthy" status for services.
- [x] Verify application is accessible at `http://localhost:8080`.
- [x] Verify API docs accessible at `http://localhost:8000/docs`.

## Dev Agent Record
- [x] Story loaded and context analyzed
- [x] Implementation plan created
- [x] Code changes implemented
- [x] Tests passed
- [x] Documentation updated
- [x] PR created

### Completion Notes
- Implemented containerization assets: `backend/Dockerfile`, `backend/.dockerignore`, `frontend/Dockerfile`, `frontend/.dockerignore`, `frontend/nginx.conf`, `docker-compose.yml`.
- Backend image uses multi-stage build, non-root runtime user, port `8000`, and Docker healthcheck on `/health`.
- Frontend image uses multi-stage build (`node:20-alpine` build, `nginx:alpine` runtime) with SPA fallback and `/api` reverse proxy to backend service.
- Updated initial Alembic migration default for PostgreSQL compatibility: `is_completed` server default changed from `0` to `false`.
- Added PostgreSQL driver dependency to backend (`psycopg[binary]`) and documented Docker workflows in `README.md`, `backend/README.md`, and `frontend/README.md`.
- Executed validation commands:
    - `cd frontend && npm run lint` (PASS)
    - `cd frontend && npm run test` (PASS)
    - `cd frontend && npm run test:e2e` (PASS: 52 passed, 3 skipped)
    - `cd /Users/raj/VSCodeProjects/todo-app-bmad-agile/backend && python3 -m pytest -q` (PASS: 30 passed, 5 subtests)
- Docker runtime verification commands (PASS):
    - `docker compose up --build -d` (initially exposed migration incompatibility, fixed in this story)
    - `docker compose ps` (`db` and `backend` healthy; `frontend` running — healthcheck added in review)
    - `curl -sSf http://localhost:8080` (PASS)
    - `curl -sSf http://localhost:8000/docs` (PASS)
    - `curl -sSf http://localhost:8080/api/health` (PASS)

## File List
- `README.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/5-2-containerization-and-deployment.md`
- `backend/README.md`
- `backend/alembic/versions/20260305_000001_create_todos_table.py`
- `backend/requirements.txt`
- `backend/requirements-dev.txt`
- `backend/Dockerfile`
- `backend/.dockerignore`
- `frontend/README.md`
- `frontend/Dockerfile`
- `frontend/.dockerignore`
- `frontend/nginx.conf`
- `.github/workflows/tests.yml`
- `docker-compose.yml`

## Change Log
- Initial creation of story file.
- 2026-03-09: Added Docker and Compose implementation artifacts, updated service documentation, executed FE/BE quality gates, and marked runtime container verification as blocked pending Docker availability.
- 2026-03-09: Resumed workflow after Docker availability, fixed PostgreSQL migration default compatibility, verified Compose health/endpoints, and completed story for review.
- 2026-03-09: Code review — fixed 5 MEDIUM issues: (M1) split pytest out of production requirements into requirements-dev.txt, updated CI; (M2) added `exec` to backend CMD for proper SIGTERM handling; (M3) added `restart: unless-stopped` to all Compose services; (M4) added X-Content-Type-Options and X-Frame-Options security headers to nginx.conf; (M5) added frontend healthcheck to docker-compose.yml so all services report healthy.
