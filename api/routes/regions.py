from fastapi import APIRouter

from models.schemas import RegionSnapshot
from services.region_service import list_regions

router = APIRouter(prefix="/regions", tags=["regions"])


@router.get("", response_model=list[RegionSnapshot])
def get_regions() -> list[RegionSnapshot]:
    return list_regions()
