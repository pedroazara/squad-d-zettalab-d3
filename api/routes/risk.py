from fastapi import APIRouter, HTTPException, Query

from models.schemas import RiskForecastResponse
from services.region_service import build_risk_payload, get_region, list_regions

router = APIRouter(prefix="/risk", tags=["risk"])


@router.get("", response_model=list[RiskForecastResponse])
def get_risk(
    region_id: int | None = Query(default=None),
    ano_mes: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
) -> list[RiskForecastResponse]:
    if region_id is not None:
        region = get_region(region_id)
        if not region:
            raise HTTPException(status_code=404, detail="Regiao nao encontrada")
        if ano_mes is not None and getattr(region, "ano_mes", None) != ano_mes:
            raise HTTPException(status_code=404, detail="Regiao nao encontrada para o periodo informado")
        return [RiskForecastResponse(**build_risk_payload(region))]

    regions = list_regions()
    if ano_mes is not None:
        regions = [region for region in regions if getattr(region, "ano_mes", None) == ano_mes]

    regions = regions[offset : offset + limit]

    return [RiskForecastResponse(**build_risk_payload(region)) for region in regions]
