from fastapi import APIRouter, HTTPException, Query

from models.schemas import RiskForecastResponse
from services.region_service import build_risk_payload, get_region, list_regions

router = APIRouter(prefix="/risk", tags=["risk"])


@router.get("", response_model=list[RiskForecastResponse])
def get_risk(region_id: int | None = Query(default=None)) -> list[RiskForecastResponse]:
    if region_id is not None:
        region = get_region(region_id)
        if not region:
            raise HTTPException(status_code=404, detail="Regiao nao encontrada")
        return [RiskForecastResponse(**build_risk_payload(region))]

    return [RiskForecastResponse(**build_risk_payload(region)) for region in list_regions()]
