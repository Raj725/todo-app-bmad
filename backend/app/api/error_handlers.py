import logging
from uuid import uuid4

from fastapi.encoders import jsonable_encoder
from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.api.schemas.error import ErrorResponse
from app.services.todo_service import TodoNotFoundError

logger = logging.getLogger(__name__)


def _request_id(request: Request) -> str:
    request_id = request.headers.get("x-request-id") or str(uuid4())
    return request_id


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    details = jsonable_encoder(exc.errors())
    error_payload = ErrorResponse(
        error={
            "code": "VALIDATION_ERROR",
            "message": "Request validation failed",
            "details": details,
            "request_id": _request_id(request),
        }
    ).model_dump()
    return JSONResponse(
        status_code=400,
        content=error_payload,
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = _request_id(request)
    logger.exception("Unhandled exception while processing request", extra={"request_id": request_id})
    error_payload = ErrorResponse(
        error={
            "code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred",
            "details": [],
            "request_id": request_id,
        }
    ).model_dump()
    return JSONResponse(
        status_code=500,
        content=error_payload,
    )


async def todo_not_found_exception_handler(request: Request, exc: TodoNotFoundError) -> JSONResponse:
    error_payload = ErrorResponse(
        error={
            "code": "NOT_FOUND",
            "message": "Todo not found",
            "details": [],
            "request_id": _request_id(request),
        }
    ).model_dump()
    return JSONResponse(
        status_code=404,
        content=error_payload,
    )
