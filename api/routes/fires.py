from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db import get_db
from fastapi import HTTPException, status

from services.region_service import get_fire_item, get_fire_point_item, list_fire_items, list_fire_point_items

router = APIRouter(tags=["fires"])

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
    db: Session = Depends(get_db),
    ano_mes: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    estado: str | None = Query(default=None),
    municipio: str | None = Query(default=None),
    limit: int = Query(default=1000, ge=1, le=10000),
    offset: int = Query(default=0, ge=0),
) -> list[FirePointItem]:
    return [FirePointItem(**row) for row in list_fire_point_items(db, ano_mes, estado, municipio, limit, offset)]


@router.get("/points/{point_id}", response_model=FirePointItem)
def get_fire_point(point_id: int, db: Session = Depends(get_db)) -> FirePointItem:
    fire_point = get_fire_point_item(db, point_id)
    if fire_point is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foco georreferenciado nao encontrado")

    return FirePointItem(**fire_point)


@router.get("/{fire_id}", response_model=FireMapItem)
def get_fire(fire_id: int, db: Session = Depends(get_db)) -> FireMapItem:
    fire_item = get_fire_item(db, fire_id)
    if fire_item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foco nao encontrado")

    return FireMapItem(**fire_item)
