from fastapi import APIRouter

router = APIRouter()


@router.get("/ready")
def readiness() -> dict[str, str]:
    return {"status": "ready"}
