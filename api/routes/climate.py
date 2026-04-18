from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from db import get_db
from models.schemas import ClimateMonthlyResponse
from services.region_service import list_climate_items

router = APIRouter(prefix="/climate", tags=["climate"])


@router.get("", response_model=list[ClimateMonthlyResponse])
def get_climate(
    db: Session = Depends(get_db),
    ano: int | None = Query(default=None, ge=1900, le=2100),
    mes: int | None = Query(default=None, ge=1, le=12),
    estacao_codigo: str | None = Query(default=None, min_length=1, max_length=20),
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
) -> list[ClimateMonthlyResponse]:
    return [
        ClimateMonthlyResponse(**row)
        for row in list_climate_items(db, ano=ano, mes=mes, estacao_codigo=estacao_codigo, limit=limit, offset=offset)
    ]
