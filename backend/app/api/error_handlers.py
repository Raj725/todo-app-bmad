import logging
from uuid import uuid4

from fastapi.encoders import jsonable_encoder
from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.services.todo_service import TodoNotFoundError

logger = logging.getLogger(__name__)


def _request_id(request: Request) -> str:
    request_id = request.headers.get("x-request-id") or str(uuid4())
    return request_id


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    details = jsonable_encoder(exc.errors())
    return JSONResponse(
        status_code=400,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": details,
                "request_id": _request_id(request),
            }
        },
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = _request_id(request)
    logger.exception("Unhandled exception while processing request", extra={"request_id": request_id})
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred",
                "details": [],
                "request_id": request_id,
            }
        },
    )


async def todo_not_found_exception_handler(request: Request, exc: TodoNotFoundError) -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content={
            "error": {
                "code": "NOT_FOUND",
                "message": "Todo not found",
                "details": [],
                "request_id": _request_id(request),
            }
        },
    )
