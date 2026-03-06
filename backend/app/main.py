from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError

from app.api.error_handlers import (
	todo_not_found_exception_handler,
	unhandled_exception_handler,
	validation_exception_handler,
)
from app.api.routes.health import router as health_router
from app.api.routes.readiness import router as readiness_router
from app.api.routes.todos import router as todos_router
from app.services.todo_service import TodoNotFoundError

app = FastAPI(title="todo-app-bmad-agile API")

app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(TodoNotFoundError, todo_not_found_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.include_router(health_router)
app.include_router(readiness_router)
app.include_router(todos_router)
