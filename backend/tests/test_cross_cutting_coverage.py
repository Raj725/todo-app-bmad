from __future__ import annotations

import asyncio
from collections.abc import Generator
from contextlib import contextmanager
from datetime import UTC, datetime

from fastapi.exceptions import RequestValidationError
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool
from starlette.requests import Request

from app.api import error_handlers
from app.api.routes import health, todos
from app.api.routes import readiness
from app.api.schemas.response import SuccessResponse
from app.db.base import Base
from app.db.models.todo import Todo
from app.repositories.todo_repository import TodoRepository
from app.schemas.todo import TodoCreateRequest, TodoResponse, TodoUpdateRequest
from app.services.todo_service import TodoNotFoundError, TodoService


def _request_with_headers(headers: dict[str, str] | None = None) -> Request:
    encoded_headers = []
    for key, value in (headers or {}).items():
        encoded_headers.append((key.lower().encode("utf-8"), value.encode("utf-8")))
    return Request({"type": "http", "headers": encoded_headers})


@contextmanager
def _session_with_engine() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False, class_=Session)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def test_request_id_uses_header_value_when_present() -> None:
    request = _request_with_headers({"x-request-id": "req-123"})
    assert error_handlers._request_id(request) == "req-123"


def test_validation_handler_returns_standard_envelope() -> None:
    request = _request_with_headers({"x-request-id": "validation-req"})
    exc = RequestValidationError(
        errors=[
            {
                "loc": ("body", "description"),
                "msg": "Field required",
                "type": "missing",
            }
        ]
    )

    response = asyncio.run(error_handlers.validation_exception_handler(request, exc))

    assert response.status_code == 400
    payload = response.body.decode("utf-8")
    assert "VALIDATION_ERROR" in payload
    assert "validation-req" in payload


def test_unhandled_and_not_found_handlers_return_standard_envelopes() -> None:
    request = _request_with_headers({"x-request-id": "err-req"})

    unhandled = asyncio.run(error_handlers.unhandled_exception_handler(request, RuntimeError("boom")))
    assert unhandled.status_code == 500
    assert "INTERNAL_SERVER_ERROR" in unhandled.body.decode("utf-8")

    not_found = asyncio.run(error_handlers.todo_not_found_exception_handler(request, TodoNotFoundError(99)))
    assert not_found.status_code == 404
    assert "NOT_FOUND" in not_found.body.decode("utf-8")


def test_readiness_reports_ready_and_not_ready_paths(monkeypatch) -> None:
    class ReadyConnection:
        def execution_options(self, **_kwargs):
            return self

        def execute(self, _query):
            return None

    class ReadyEngine:
        def connect(self):
            class Ctx:
                def __enter__(self):
                    return ReadyConnection()

                def __exit__(self, exc_type, exc, tb):
                    return False

            return Ctx()

    class DownEngine:
        def connect(self):
            class Ctx:
                def __enter__(self):
                    raise SQLAlchemyError("db unavailable")

                def __exit__(self, exc_type, exc, tb):
                    return False

            return Ctx()

    monkeypatch.setattr(readiness, "engine", ReadyEngine())
    ready_response = readiness.readiness()
    assert ready_response.status_code == 200
    assert b'"status":"ready"' in ready_response.body

    monkeypatch.setattr(readiness, "engine", DownEngine())
    down_response = readiness.readiness()
    assert down_response.status_code == 503
    assert b'"status":"not_ready"' in down_response.body


def test_todo_request_models_validate_and_normalize() -> None:
    create_payload = TodoCreateRequest(description="  trim me  ")
    assert create_payload.description == "trim me"

    update_payload = TodoUpdateRequest(description="  next value  ")
    assert update_payload.description == "next value"

    update_toggle = TodoUpdateRequest(is_completed=True)
    assert update_toggle.is_completed is True


def test_todo_update_requires_at_least_one_field() -> None:
    try:
        TodoUpdateRequest()
        raise AssertionError("Expected model validation to fail")
    except Exception as exc:
        assert "at least one field" in str(exc)


def test_todo_service_raises_not_found_when_repository_returns_none() -> None:
    class RepoStub:
        def create(self, description: str):
            return Todo(id=1, description=description, is_completed=False, created_at=datetime.now(UTC))

        def list(self):
            return []

        def update(self, todo_id: int, is_completed: bool | None = None, description: str | None = None):
            return None

        def delete(self, todo_id: int):
            return None

    service = TodoService(RepoStub())
    created = service.create_todo("task")
    assert created.description == "task"
    assert service.list_todos() == []

    try:
        service.update_todo(1, is_completed=True)
        raise AssertionError("Expected TodoNotFoundError")
    except TodoNotFoundError:
        pass

    try:
        service.delete_todo(1)
        raise AssertionError("Expected TodoNotFoundError")
    except TodoNotFoundError:
        pass


def test_todo_repository_crud_paths() -> None:
    with _session_with_engine() as session:
        repo = TodoRepository(session)

        created = repo.create("repo todo")
        assert created.id > 0

        listed = repo.list()
        assert len(listed) == 1

        updated = repo.update(created.id, is_completed=True, description="updated")
        assert updated is not None
        assert updated.is_completed is True
        assert updated.description == "updated"

        assert repo.update(9999, is_completed=True) is None
        assert repo.delete(9999) is None
        assert repo.delete(created.id) is True


def test_routes_cover_health_and_todo_crud_paths() -> None:
    with _session_with_engine() as session:
        health_payload = health.health()
        assert health_payload == {"status": "ok"}

        created = todos.create_todo(TodoCreateRequest(description="Route todo"), session)
        assert isinstance(created, SuccessResponse)
        created_id = created.data.id

        listed = todos.list_todos(session)
        assert len(listed.data) == 1

        updated = todos.update_todo(created_id, TodoUpdateRequest(is_completed=True), session)
        assert updated.data.is_completed is True

        todos.delete_todo(created_id, session)
        remaining = todos.list_todos(session)
        assert remaining.data == []


def test_todo_response_supports_from_attributes() -> None:
    todo = Todo(id=1, description="from attrs", is_completed=False, created_at=datetime.now(UTC))
    response = TodoResponse.model_validate(todo)
    assert response.id == 1
    assert response.description == "from attrs"
