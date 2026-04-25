from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db import get_db
from models.schemas import RiskForecastResponse
from services.authz_service import get_current_user
from services.region_service import get_risk_payload, list_risk_payloads

router = APIRouter(tags=["risk"], dependencies=[Depends(get_current_user)])


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


@router.get("/{region_id}", response_model=RiskForecastResponse)
def get_risk_by_region(
    region_id: int,
    db: Session = Depends(get_db),
    ano_mes: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
) -> RiskForecastResponse:
    payload = get_risk_payload(db, region_id, ano_mes)
    if payload is None:
        raise HTTPException(status_code=404, detail="Regiao nao encontrada")

    return RiskForecastResponse(**payload)
