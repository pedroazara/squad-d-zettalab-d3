from collections import defaultdict
import unicodedata

from fastapi import APIRouter, Query
from pydantic import BaseModel

from services.ingestion.file_loaders import FaunaRecord, load_fauna_records

router = APIRouter(tags=["fauna"])

_ALLOWED_STATES = {
    "BAHIA",
    "DISTRITO FEDERAL",
    "GOIAS",
    "MARANHAO",
    "MATO GROSSO",
    "MATO GROSSO DO SUL",
    "MINAS GERAIS",
    "PARANA",
    "PIAUI",
    "RONDONIA",
    "SAO PAULO",
    "TOCANTINS",
}


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
    estado: str | None,
    bioma: str | None,
    grupo: str | None,
    status_iucn: str | None,
    ano: int | None,
    mes: int | None,
    search: str | None,
) -> list[FaunaRecord]:
    search_term = (search or "").strip().lower()
    filtered: list[FaunaRecord] = []

    for row in load_fauna_records():
        if _normalize_state(row.estado) not in _ALLOWED_STATES:
            continue
        if estado and row.estado.lower() != estado.lower():
            continue
        if bioma and row.bioma.lower() != bioma.lower():
            continue
        if grupo and row.grupo.lower() != grupo.lower():
            continue
        if status_iucn and row.status_iucn.lower() != status_iucn.lower():
            continue
        if ano is not None and row.ano != ano:
            continue
        if mes is not None and row.mes != mes:
            continue
        if search_term:
            haystack = f"{row.nome_cientifico} {row.nome_popular} {row.grupo} {row.estado}"
            if search_term not in haystack.lower():
                continue
        filtered.append(row)

    return filtered


@router.get("/filters", response_model=FaunaFilterOptions)
def get_filters() -> FaunaFilterOptions:
    rows = _filter_records(None, None, None, None, None, None, None)
    return FaunaFilterOptions(
        estados=sorted({row.estado for row in rows if row.estado.strip()}),
        biomas=sorted({row.bioma for row in rows if row.bioma.strip()}),
        grupos=sorted({row.grupo for row in rows if row.grupo.strip()}),
        status_iucn=sorted({row.status_iucn for row in rows if row.status_iucn.strip()}),
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
) -> list[FaunaOccurrenceItem]:
    rows = _filter_records(estado, bioma, grupo, status_iucn, ano, mes, search)
    sliced = rows[offset : offset + limit]
    return [
        FaunaOccurrenceItem(
            id=offset + idx + 1,
            nome_cientifico=row.nome_cientifico,
            nome_popular=row.nome_popular,
            grupo=row.grupo,
            status_iucn=row.status_iucn,
            bioma=row.bioma,
            bioma_principal=row.bioma_principal,
            habitat_afetado_pct=row.habitat_afetado_pct,
            latitude=row.latitude,
            longitude=row.longitude,
            estado=row.estado,
            ano=row.ano,
            mes=row.mes,
            ano_mes=row.ano_mes,
        )
        for idx, row in enumerate(sliced)
    ]


@router.get("/timeline", response_model=list[FaunaTimelineItem])
def get_timeline(
    granularity: str = Query(default="mensal", pattern=r"^(anual|mensal)$"),
    estado: str | None = Query(default=None),
    bioma: str | None = Query(default=None),
    grupo: str | None = Query(default=None),
) -> list[FaunaTimelineItem]:
    rows = _filter_records(estado, bioma, grupo, None, None, None, None)
    grouped: dict[str, int] = defaultdict(int)

    for row in rows:
        key = str(row.ano) if granularity == "anual" else row.ano_mes
        grouped[key] += 1

    return [FaunaTimelineItem(periodo=periodo, ocorrencias=grouped[periodo]) for periodo in sorted(grouped.keys())]


@router.get("/distribution/groups", response_model=list[FaunaGroupDistributionItem])
def get_group_distribution(
    estado: str | None = Query(default=None),
    bioma: str | None = Query(default=None),
) -> list[FaunaGroupDistributionItem]:
    rows = _filter_records(estado, bioma, None, None, None, None, None)
    grouped: dict[str, list[FaunaRecord]] = defaultdict(list)
    for row in rows:
        grouped[row.grupo].append(row)

    return [
        FaunaGroupDistributionItem(
            grupo=group,
            ocorrencias=len(items),
            media_habitat_afetado=round(sum(item.habitat_afetado_pct for item in items) / len(items), 2),
        )
        for group, items in sorted(grouped.items(), key=lambda item: item[0])
    ]


@router.get("/distribution/states", response_model=list[FaunaStateDistributionItem])
def get_state_distribution(
    bioma: str | None = Query(default=None),
    grupo: str | None = Query(default=None),
) -> list[FaunaStateDistributionItem]:
    rows = _filter_records(None, bioma, grupo, None, None, None, None)
    grouped: dict[str, int] = defaultdict(int)
    for row in rows:
        grouped[row.estado] += 1

    sorted_rows = sorted(grouped.items(), key=lambda item: item[1], reverse=True)
    return [FaunaStateDistributionItem(regiao=state, ocorrencias=count) for state, count in sorted_rows]


@router.get("/biodiversity/summary", response_model=FaunaBiodiversitySummary)
def get_biodiversity_summary(
    estado: str | None = Query(default=None),
    bioma: str | None = Query(default=None),
    grupo: str | None = Query(default=None),
) -> FaunaBiodiversitySummary:
    rows = _filter_records(estado, bioma, grupo, None, None, None, None)
    if not rows:
        return FaunaBiodiversitySummary(
            total_ocorrencias=0,
            total_especies=0,
            media_habitat_afetado=0,
            por_status_iucn={},
        )

    status_counts: dict[str, int] = defaultdict(int)
    for row in rows:
        status_counts[row.status_iucn] += 1

    return FaunaBiodiversitySummary(
        total_ocorrencias=len(rows),
        total_especies=len({row.nome_cientifico for row in rows}),
        media_habitat_afetado=round(sum(row.habitat_afetado_pct for row in rows) / len(rows), 2),
        por_status_iucn=dict(sorted(status_counts.items(), key=lambda item: item[0])),
    )


@router.get("/biodiversity/species", response_model=list[FaunaSpeciesItem])
def list_species(
    estado: str | None = Query(default=None),
    bioma: str | None = Query(default=None),
    grupo: str | None = Query(default=None),
    status_iucn: str | None = Query(default=None),
) -> list[FaunaSpeciesItem]:
    rows = _filter_records(estado, bioma, grupo, status_iucn, None, None, None)

    species_map: dict[str, list[FaunaRecord]] = defaultdict(list)
    for row in rows:
        species_map[row.nome_cientifico].append(row)

    output: list[FaunaSpeciesItem] = []
    for items in species_map.values():
        first = items[0]
        avg_lat = sum(item.latitude for item in items) / len(items)
        avg_lng = sum(item.longitude for item in items) / len(items)
        avg_habitat = sum(item.habitat_afetado_pct for item in items) / len(items)
        output.append(
            FaunaSpeciesItem(
                nome_cientifico=first.nome_cientifico,
                nome_popular=first.nome_popular,
                grupo=first.grupo,
                status=first.status_iucn,
                bioma=first.bioma,
                percentualAfetado=round(avg_habitat, 2),
                location={"lat": round(avg_lat, 6), "lng": round(avg_lng, 6)},
            )
        )

    output.sort(key=lambda item: (item.nome_popular, item.nome_cientifico))
    return output
