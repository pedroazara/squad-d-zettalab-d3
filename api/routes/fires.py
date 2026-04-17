import csv
from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db import get_db
from services.region_service import list_fire_items

router = APIRouter(prefix="/fires", tags=["fires"])

PROJECT_ROOT = Path(__file__).resolve().parents[2]
POINTS_DATA_FILE = PROJECT_ROOT / "data" / "interim" / "focos" / "focos_limpos_detalhados.csv"


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


class FirePointItem(BaseModel):
    id: int
    data_hora: str
    satelite: str
    estado: str
    municipio: str
    bioma: str
    risco_fogo: float
    frp: float
    latitude: float
    longitude: float
    ano_mes: str


def _parse_float(value: str) -> float:
    normalized = value.strip()
    if not normalized:
        return 0.0
    return float(normalized)


@lru_cache(maxsize=1)
def _load_fire_points() -> list[FirePointItem]:
    if not POINTS_DATA_FILE.exists():
        raise FileNotFoundError(f"Arquivo de dados nao encontrado: {POINTS_DATA_FILE}")

    points: list[FirePointItem] = []
    with POINTS_DATA_FILE.open("r", encoding="utf-8-sig", newline="") as data_file:
        reader = csv.DictReader(data_file)
        for index, row in enumerate(reader, start=1):
            latitude = row.get("Latitude", "").strip()
            longitude = row.get("Longitude", "").strip()
            if not latitude or not longitude:
                continue

            points.append(
                FirePointItem(
                    id=index,
                    data_hora=row.get("DataHora", "").strip(),
                    satelite=row.get("Satelite", "").strip(),
                    estado=row.get("Estado_Clean", row.get("Estado", "")).strip(),
                    municipio=row.get("Municipio_Clean", row.get("Municipio", "")).strip(),
                    bioma=row.get("Bioma", "").strip(),
                    risco_fogo=_parse_float(row.get("RiscoFogo", "0")),
                    frp=_parse_float(row.get("FRP", "0")),
                    latitude=float(latitude),
                    longitude=float(longitude),
                    ano_mes=row.get("AnoMes", "").strip(),
                )
            )

    return points


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
    db: Session = Depends(get_db),
    ano_mes: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    estado: str | None = Query(default=None),
    municipio: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
) -> list[FireMapItem]:
    return [FireMapItem(**row) for row in list_fire_items(db, ano_mes, estado, municipio, limit, offset)]


@router.get(
    "/points",
    response_model=list[FirePointItem],
    summary="Lista focos georreferenciados para mapa de pontos",
    description="Retorna focos com latitude/longitude para visualizacao direta em mapa de marcadores/cluster.",
)
def get_fire_points(
    ano_mes: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    estado: str | None = Query(default=None),
    municipio: str | None = Query(default=None),
    limit: int = Query(default=1000, ge=1, le=10000),
    offset: int = Query(default=0, ge=0),
) -> list[FirePointItem]:
    points = _load_fire_points()

    if ano_mes is not None:
        points = [point for point in points if point.ano_mes == ano_mes]

    if estado is not None:
        state_filter = estado.strip().upper()
        points = [point for point in points if point.estado.upper() == state_filter]

    if municipio is not None:
        city_filter = municipio.strip().upper()
        points = [point for point in points if point.municipio.upper() == city_filter]

    return points[offset : offset + limit]
