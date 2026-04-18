from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from db import get_db
from models.schemas import RegionSnapshot
from services.authz_service import get_current_user
from services.region_service import get_region_snapshot, list_region_snapshots

router = APIRouter(prefix="/regions", tags=["regions"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[RegionSnapshot])
def get_regions(
    db: Session = Depends(get_db),
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    ano_mes: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
) -> list[RegionSnapshot]:
    return [RegionSnapshot(**row) for row in list_region_snapshots(db, limit, offset, ano_mes)]


@router.get("/{region_id}", response_model=RegionSnapshot)
def get_region(region_id: int, db: Session = Depends(get_db), ano_mes: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$")) -> RegionSnapshot:
    snapshot = get_region_snapshot(db, region_id, ano_mes)
    if snapshot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Regiao nao encontrada")

    return RegionSnapshot(**snapshot)
