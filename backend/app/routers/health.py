from fastapi import APIRouter


router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def get_health() -> dict[str, str]:
    return {"status": "ok", "build": "1.0.1"}

