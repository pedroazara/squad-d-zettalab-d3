import csv
from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter, Query
from pydantic import BaseModel

from services.risk_service import AggregateRiskInput, calculate_aggregate_risk_score, classify_risk

router = APIRouter(prefix="/fires", tags=["fires"])

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_FILE = PROJECT_ROOT / "data" / "processed" / "focos" / "focos_por_municipio_mes.csv"


class FireMapItem(BaseModel):
    id: int
    estado: str
    municipio: str
    ano_mes: str
    quantidade_focos: int
    risco_fogo_mediano: float
    frp_mediano: float
    score: float
    risco: str


def _parse_int(value: str) -> int:
    return int(float(value))


def _parse_float(value: str) -> float:
    normalized = value.strip()
    if not normalized:
        return 0.0
    return float(normalized)


@lru_cache(maxsize=1)
def _load_data() -> list[FireMapItem]:
    records: list[FireMapItem] = []

    with DATA_FILE.open("r", encoding="utf-8-sig", newline="") as data_file:
        reader = csv.DictReader(data_file)
        for index, row in enumerate(reader, start=1):
            quantidade_focos = _parse_int(row["Quantidade_Focos"])
            risco_fogo_mediano = _parse_float(row["RiscoFogo_Mediano"])
            frp_mediano = _parse_float(row["FRP_Mediano"])
            score = calculate_aggregate_risk_score(
                AggregateRiskInput(
                    quantidade_focos=quantidade_focos,
                    risco_fogo_mediano=risco_fogo_mediano,
                    frp_mediano=frp_mediano,
                )
            )
            records.append(
                FireMapItem(
                    id=index,
                    estado=row["Estado_Clean"].strip(),
                    municipio=row["Municipio_Clean"].strip(),
                    ano_mes=row["AnoMes"].strip(),
                    quantidade_focos=quantidade_focos,
                    risco_fogo_mediano=risco_fogo_mediano,
                    frp_mediano=frp_mediano,
                    score=score,
                    risco=classify_risk(score),
                )
            )

    return records


@router.get(
    "",
    response_model=list[FireMapItem],
    summary="Lista focos agregados para visualizacao de mapa",
    description=(
        "Retorna dados agregados por municipio/mes a partir da base processed. "
        "Esta versao nao possui lat/lon por ponto individual e deve ser usada "
        "como base de mapa agregado (heat/cluster por municipio)."
    ),
)
def get_fires(
    ano_mes: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    estado: str | None = Query(default=None),
    municipio: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
) -> list[FireMapItem]:
    records = _load_data()

    if ano_mes is not None:
        records = [item for item in records if item.ano_mes == ano_mes]

    if estado is not None:
        state_filter = estado.strip().upper()
        records = [item for item in records if item.estado.upper() == state_filter]

    if municipio is not None:
        city_filter = municipio.strip().upper()
        records = [item for item in records if item.municipio.upper() == city_filter]

    return records[offset : offset + limit]
