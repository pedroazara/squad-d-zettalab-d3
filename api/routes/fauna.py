from collections import defaultdict
import unicodedata

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db import get_db
from services.repositories.fauna_repository import (
    filter_fauna_records,
    get_fauna_biodiversity_summary,
    get_fauna_filters,
    get_fauna_group_distribution,
    get_fauna_species,
    get_fauna_state_distribution,
    get_fauna_timeline,
)

router = APIRouter(tags=["fauna"])

def _normalize_state(value: str) -> str:
    normalized = unicodedata.normalize("NFD", (value or "").strip())
    normalized = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    return normalized.upper()

# Estados permitidos, já normalizados
_ALLOWED_STATES = set(
    _normalize_state(s) for s in [
        "ACRE",
        "AMAPA",
        "AMAZONAS",
        "BAHIA",
        "DISTRITO FEDERAL",
        "GOIAS",
        "MARANHAO",
        "MATO GROSSO",
        "MATO GROSSO DO SUL",
        "MINAS GERAIS",
        "PARA",
        "PARANA",
        "PIAUI",
        "RONDONIA",
        "RORAIMA",
        "SAO PAULO",
        "TOCANTINS",
    ]
)

def _normalize_state(value: str) -> str:
    normalized = unicodedata.normalize("NFD", (value or "").strip())
    normalized = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    return normalized.upper()


class FaunaOccurrenceItem(BaseModel):
    id: int
    nome_cientifico: str
    nome_popular: str
    grupo: str
    status_iucn: str
    bioma: str
    bioma_principal: str
    habitat_afetado_pct: float
    latitude: float
    longitude: float
    estado: str
    ano: int
    mes: int
    ano_mes: str


class FaunaFilterOptions(BaseModel):
    estados: list[str]
    biomas: list[str]
    grupos: list[str]
    status_iucn: list[str]


class FaunaTimelineItem(BaseModel):
    periodo: str
    ocorrencias: int


class FaunaGroupDistributionItem(BaseModel):
    grupo: str
    ocorrencias: int
    media_habitat_afetado: float


class FaunaStateDistributionItem(BaseModel):
    regiao: str
    ocorrencias: int


class FaunaBiodiversitySummary(BaseModel):
    total_ocorrencias: int
    total_especies: int
    media_habitat_afetado: float
    por_status_iucn: dict[str, int]


class FaunaSpeciesItem(BaseModel):
    nome_cientifico: str
    nome_popular: str
    grupo: str
    status: str
    bioma: str
    percentualAfetado: float
    location: dict[str, float]


def _filter_records(
    db: Session,
    estado: str | None,
    bioma: str | None,
    grupo: str | None,
    status_iucn: str | None,
    ano: int | None,
    mes: int | None,
    search: str | None,
    limit: int = 500,
    offset: int = 0,
) -> list:
    rows = filter_fauna_records(
        db,
        estado=estado,
        bioma=bioma,
        grupo=grupo,
        status_iucn=status_iucn,
        ano=ano,
        mes=mes,
        search=search,
        limit=limit,
        offset=offset,
    )
    
    # Filter by allowed states
    return [row for row in rows if _normalize_state(row.estado) in _ALLOWED_STATES]


@router.get("/filters", response_model=FaunaFilterOptions)
def get_filters(db: Session = Depends(get_db)) -> FaunaFilterOptions:
    filters = get_fauna_filters(db)
    
    # Filter by allowed states
    allowed_estados = [e for e in filters["estados"] if _normalize_state(e) in _ALLOWED_STATES]
    
    return FaunaFilterOptions(
        estados=allowed_estados,
        biomas=filters["biomas"],
        grupos=filters["grupos"],
        status_iucn=filters["status_iucn"],
    )


@router.get("/occurrences", response_model=list[FaunaOccurrenceItem])
def list_occurrences(
    estado: str | None = Query(default=None),
    bioma: str | None = Query(default=None),
    grupo: str | None = Query(default=None),
    status_iucn: str | None = Query(default=None),
    ano: int | None = Query(default=None),
    mes: int | None = Query(default=None, ge=1, le=12),
    search: str | None = Query(default=None),
    limit: int = Query(default=500, ge=1, le=5000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[FaunaOccurrenceItem]:
    rows = _filter_records(db, estado, bioma, grupo, status_iucn, ano, mes, search, limit, offset)
    return [
        FaunaOccurrenceItem(
            id=row.id,
            nome_cientifico=row.nome_cientifico,
            nome_popular=row.nome_popular or "",
            grupo=row.grupo or "",
            status_iucn=row.status_iucn or "",
            bioma=row.bioma or "",
            bioma_principal=row.bioma_principal or "",
            habitat_afetado_pct=row.habitat_afetado_pct or 0,
            latitude=row.latitude or 0,
            longitude=row.longitude or 0,
            estado=row.estado or "",
            ano=row.ano or 0,
            mes=row.mes or 0,
            ano_mes=f"{row.ano or 0:04d}-{row.mes or 0:02d}",
        )
        for row in rows
    ]


@router.get("/timeline", response_model=list[FaunaTimelineItem])
def get_timeline(
    granularity: str = Query(default="mensal", pattern=r"^(anual|mensal)$"),
    estado: str | None = Query(default=None),
    bioma: str | None = Query(default=None),
    grupo: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[FaunaTimelineItem]:
    timeline = get_fauna_timeline(db, granularity, estado, bioma, grupo)
    return [FaunaTimelineItem(periodo=item["periodo"], ocorrencias=item["ocorrencias"]) for item in timeline]


@router.get("/distribution/groups", response_model=list[FaunaGroupDistributionItem])
def get_group_distribution(
    estado: str | None = Query(default=None),
    bioma: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[FaunaGroupDistributionItem]:
    distribution = get_fauna_group_distribution(db, estado, bioma)
    return [
        FaunaGroupDistributionItem(
            grupo=item["grupo"],
            ocorrencias=item["ocorrencias"],
            media_habitat_afetado=item["media_habitat_afetado"],
        )
        for item in distribution
    ]


@router.get("/distribution/states", response_model=list[FaunaStateDistributionItem])
def get_state_distribution(
    bioma: str | None = Query(default=None),
    grupo: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[FaunaStateDistributionItem]:
    distribution = get_fauna_state_distribution(db, bioma, grupo)
    return [
        FaunaStateDistributionItem(regiao=item["regiao"], ocorrencias=item["ocorrencias"]) for item in distribution
    ]


@router.get("/biodiversity/summary", response_model=FaunaBiodiversitySummary)
def get_biodiversity_summary(
    estado: str | None = Query(default=None),
    bioma: str | None = Query(default=None),
    grupo: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> FaunaBiodiversitySummary:
    summary = get_fauna_biodiversity_summary(db, estado, bioma, grupo)
    return FaunaBiodiversitySummary(
        total_ocorrencias=summary["total_ocorrencias"],
        total_especies=summary["total_especies"],
        media_habitat_afetado=summary["media_habitat_afetado"],
        por_status_iucn=summary["por_status_iucn"],
    )


@router.get("/biodiversity/species", response_model=list[FaunaSpeciesItem])
def list_species(
    estado: str | None = Query(default=None),
    bioma: str | None = Query(default=None),
    grupo: str | None = Query(default=None),
    status_iucn: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[FaunaSpeciesItem]:
    species = get_fauna_species(db, estado, bioma, grupo, status_iucn)
    return [
        FaunaSpeciesItem(
            nome_cientifico=item["nome_cientifico"],
            nome_popular=item["nome_popular"],
            grupo=item["grupo"],
            status=item["status"],
            bioma=item["bioma"],
            percentualAfetado=item["percentualAfetado"],
            location=item["location"],
        )
        for item in species
    ]
