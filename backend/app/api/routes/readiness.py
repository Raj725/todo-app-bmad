from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.db.session import engine

router = APIRouter()


@router.get("/ready")
def readiness() -> JSONResponse:
    try:
        with engine.connect() as connection:
            connection.execution_options(timeout=2).execute(text("SELECT 1"))
    except SQLAlchemyError:
        return JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "checks": {
                    "database": "unavailable",
                },
            },
        )

    return JSONResponse(
        status_code=200,
        content={
            "status": "ready",
            "checks": {
                "database": "ok",
            },
        },
    )
