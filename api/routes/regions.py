from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from db import get_db
from models.schemas import RegionSnapshot
from services.region_service import list_region_snapshots

router = APIRouter(prefix="/regions", tags=["regions"])


@router.get("", response_model=list[RegionSnapshot])
def get_regions(
    db: Session = Depends(get_db),
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
) -> list[RegionSnapshot]:
    return [RegionSnapshot(**row) for row in list_region_snapshots(db, limit, offset)]
