# Story 5.2: Containerization and Deployment

## Story Context
**Epic:** 5 - Production Readiness & Quality Gates
**Story:** 5.2 - Containerization and Deployment
**Status:** Ready for Dev

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
- [ ] Create `backend/Dockerfile` using `python:3.11-slim` or similar lightweight base image.
    - [ ] Implement multi-stage build to minimize image size (build vs runtime).
    - [ ] Run application as a **non-root user** for security.
    - [ ] Expose port 8000.
    - [ ] Include health check instruction in Dockerfile or Compose.
    - [ ] Verify `uvicorn` starts successfully within the container. (e.g., `docker run -p 8000:8000 backend_image`)
    - [ ] Create `.dockerignore` for backend (exclude `.venv`, `__pycache__`, etc.)

### Frontend Containerization
- [ ] Create `frontend/Dockerfile` using `node:20-alpine` (or similar).
    - [ ] Implement multi-stage build: Stage 1 Build (npm ci, npm run build), Stage 2 Serve (nginx:alpine).
    - [ ] Configure Nginx to handle SPA routing (redirect 404s to `index.html`) using a custom `nginx.conf`.
    - [ ] Run Nginx as non-root user if possible (or standard nginx user).
    - [ ] Expose port 80.
    - [ ] Create `.dockerignore` for frontend (exclude `node_modules`, `dist`, etc.)

### Orchestration with Docker Compose
- [ ] Create `docker-compose.yml` in the project root.
    - [ ] Define `backend` service: Maps port 8000:8000.
    - [ ] Define `frontend` service: Maps port 8080:80.
    - [ ] Define `db` service (PostgreSQL): Persist data with volume.
- [ ] Configure networking so `frontend` (browser-side) can talk to `backend` (API).
    - [ ] Implement Nginx reverse proxy config in `frontend/nginx.conf` to forward `/api` requests to `http://backend:8000`.
- [ ] Define environment variables for database connection strings.

### Verification & Health Checks
- [ ] Implement health checks for services.
    - [ ] Backend: `/health` endpoint returning 200 OK.
    - [ ] PostgreSql: `pg_isready`.
- [ ] Verify `docker-compose up` starts the full stack successfully.
- [ ] Verify `docker-compose ps` shows "healthy" status for services.
- [ ] Verify application is accessible at `http://localhost:8080`.
- [ ] Verify API docs accessible at `http://localhost:8000/docs`.

## Dev Agent Record
- [ ] Story loaded and context analyzed
- [ ] Implementation plan created
- [ ] Code changes implemented
- [ ] Tests passed
- [ ] Documentation updated
- [ ] PR created

## File List
- `backend/Dockerfile`
- `backend/.dockerignore`
- `frontend/Dockerfile`
- `frontend/.dockerignore`
- `frontend/nginx.conf`
- `docker-compose.yml`

## Change Log
- Initial creation of story file.
