from fastapi import FastAPI

from app.api.routes.health import router as health_router
from app.api.routes.readiness import router as readiness_router

app = FastAPI(title="todo-app-bmad-agile API")

app.include_router(health_router)
app.include_router(readiness_router)
