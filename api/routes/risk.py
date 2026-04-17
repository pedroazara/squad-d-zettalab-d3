from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db import get_db
from models.schemas import RiskForecastResponse
from services.region_service import list_risk_payloads

router = APIRouter(prefix="/risk", tags=["risk"])


@router.get("", response_model=list[RiskForecastResponse])
def get_risk(
    db: Session = Depends(get_db),
    region_id: int | None = Query(default=None),
    ano_mes: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
) -> list[RiskForecastResponse]:
    rows = list_risk_payloads(db, region_id, ano_mes, limit, offset)
    if region_id is not None and not rows:
        raise HTTPException(status_code=404, detail="Regiao nao encontrada")
    return [RiskForecastResponse(**row) for row in rows]
