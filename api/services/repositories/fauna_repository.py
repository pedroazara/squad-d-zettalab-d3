"""
Repository de operacoes de banco de dados para fauna.

Camada de acesso a dados para consulta de ocorrencias de fauna.
"""

from collections import defaultdict
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from models.entities import FaunaOccurrence


def get_fauna_filters(db: Session) -> dict[str, list[str]]:
    """
    Retorna opcoes de filtro disponiveis para fauna.

    Args:
        db: Sessão do banco

    Returns:
        Dicionario com listas de estados, biomas, grupos e status IUCN
    """
    query = select(FaunaOccurrence)
    rows = db.execute(query).scalars().all()

    return {
        "estados": sorted({row.estado for row in rows if row.estado and row.estado.strip()}),
        "biomas": sorted({row.bioma for row in rows if row.bioma and row.bioma.strip()}),
        "grupos": sorted({row.grupo for row in rows if row.grupo and row.grupo.strip()}),
        "status_iucn": sorted({row.status_iucn for row in rows if row.status_iucn and row.status_iucn.strip()}),
    }


def filter_fauna_records(
    db: Session,
    estado: str | None = None,
    bioma: str | None = None,
    grupo: str | None = None,
    status_iucn: str | None = None,
    ano: int | None = None,
    mes: int | None = None,
    search: str | None = None,
    limit: int = 500,
    offset: int = 0,
) -> list[FaunaOccurrence]:
    """
    Filtra registros de fauna com base nos criterios fornecidos.

    Args:
        db: Sessão do banco
        estado: Filtro por estado
        bioma: Filtro por bioma
        grupo: Filtro por grupo taxonomico
        status_iucn: Filtro por status IUCN
        ano: Filtro por ano
        mes: Filtro por mes
        search: Termo de busca em nome cientifico, popular, grupo ou estado
        limit: Limite de registros
        offset: Offset para paginacao

    Returns:
        Lista de FaunaOccurrence filtrados
    """
    query = select(FaunaOccurrence)

    # Aplicar filtros
    if estado:
        query = query.where(func.lower(FaunaOccurrence.estado) == func.lower(estado))
    if bioma:
        query = query.where(func.lower(FaunaOccurrence.bioma) == func.lower(bioma))
    if grupo:
        query = query.where(func.lower(FaunaOccurrence.grupo) == func.lower(grupo))
    if status_iucn:
        query = query.where(func.lower(FaunaOccurrence.status_iucn) == func.lower(status_iucn))
    if ano is not None:
        query = query.where(FaunaOccurrence.ano == ano)
    if mes is not None:
        query = query.where(FaunaOccurrence.mes == mes)
    if search:
        search_term = f"%{search.lower()}%"
        query = query.where(
            (func.lower(FaunaOccurrence.nome_cientifico).like(search_term))
            | (func.lower(FaunaOccurrence.nome_popular).like(search_term))
            | (func.lower(FaunaOccurrence.grupo).like(search_term))
            | (func.lower(FaunaOccurrence.estado).like(search_term))
        )

    # Ordenar e paginar
    query = query.order_by(FaunaOccurrence.id).offset(offset).limit(limit)

    return list(db.execute(query).scalars().all())


def get_fauna_timeline(
    db: Session,
    granularity: str = "mensal",
    estado: str | None = None,
    bioma: str | None = None,
    grupo: str | None = None,
) -> list[dict[str, int | str]]:
    """
    Retorna timeline de ocorrencias de fauna.

    Args:
        db: Sessão do banco
        granularity: 'anual' ou 'mensal'
        estado: Filtro por estado
        bioma: Filtro por bioma
        grupo: Filtro por grupo

    Returns:
        Lista de dicionarios com periodo e contagem de ocorrencias
    """
    query = select(FaunaOccurrence)

    if estado:
        query = query.where(func.lower(FaunaOccurrence.estado) == func.lower(estado))
    if bioma:
        query = query.where(func.lower(FaunaOccurrence.bioma) == func.lower(bioma))
    if grupo:
        query = query.where(func.lower(FaunaOccurrence.grupo) == func.lower(grupo))

    rows = db.execute(query).scalars().all()

    grouped: dict[str, int] = defaultdict(int)
    for row in rows:
        key = str(row.ano) if granularity == "anual" else f"{row.ano:04d}-{row.mes:02d}"
        grouped[key] += 1

    return [{"periodo": periodo, "ocorrencias": grouped[periodo]} for periodo in sorted(grouped.keys())]


def get_fauna_group_distribution(
    db: Session,
    estado: str | None = None,
    bioma: str | None = None,
) -> list[dict[str, float | str]]:
    """
    Retorna distribuicao de ocorrencias por grupo taxonomico.

    Args:
        db: Sessão do banco
        estado: Filtro por estado
        bioma: Filtro por bioma

    Returns:
        Lista de dicionarios com grupo, ocorrencias e media de habitat afetado
    """
    query = select(FaunaOccurrence)

    if estado:
        query = query.where(func.lower(FaunaOccurrence.estado) == func.lower(estado))
    if bioma:
        query = query.where(func.lower(FaunaOccurrence.bioma) == func.lower(bioma))

    rows = db.execute(query).scalars().all()

    grouped: dict[str, list[FaunaOccurrence]] = defaultdict(list)
    for row in rows:
        grouped[row.grupo].append(row)

    return [
        {
            "grupo": group,
            "ocorrencias": len(items),
            "media_habitat_afetado": round(
                sum(item.habitat_afetado_pct or 0 for item in items) / len(items), 2
            ),
        }
        for group, items in sorted(grouped.items(), key=lambda item: item[0])
    ]


def get_fauna_state_distribution(
    db: Session,
    bioma: str | None = None,
    grupo: str | None = None,
) -> list[dict[str, int | str]]:
    """
    Retorna distribuicao de ocorrencias por estado.

    Args:
        db: Sessão do banco
        bioma: Filtro por bioma
        grupo: Filtro por grupo

    Returns:
        Lista de dicionarios com regiao e ocorrencias
    """
    query = select(FaunaOccurrence)

    if bioma:
        query = query.where(func.lower(FaunaOccurrence.bioma) == func.lower(bioma))
    if grupo:
        query = query.where(func.lower(FaunaOccurrence.grupo) == func.lower(grupo))

    rows = db.execute(query).scalars().all()

    grouped: dict[str, int] = defaultdict(int)
    for row in rows:
        grouped[row.estado] += 1

    sorted_rows = sorted(grouped.items(), key=lambda item: item[1], reverse=True)
    return [{"regiao": state, "ocorrencias": count} for state, count in sorted_rows]


def get_fauna_biodiversity_summary(
    db: Session,
    estado: str | None = None,
    bioma: str | None = None,
    grupo: str | None = None,
) -> dict[str, int | float | dict[str, int]]:
    """
    Retorna resumo de biodiversidade de fauna.

    Args:
        db: Sessão do banco
        estado: Filtro por estado
        bioma: Filtro por bioma
        grupo: Filtro por grupo

    Returns:
        Dicionario com totais e distribuicao por status IUCN
    """
    query = select(FaunaOccurrence)

    if estado:
        query = query.where(func.lower(FaunaOccurrence.estado) == func.lower(estado))
    if bioma:
        query = query.where(func.lower(FaunaOccurrence.bioma) == func.lower(bioma))
    if grupo:
        query = query.where(func.lower(FaunaOccurrence.grupo) == func.lower(grupo))

    rows = db.execute(query).scalars().all()

    if not rows:
        return {
            "total_ocorrencias": 0,
            "total_especies": 0,
            "media_habitat_afetado": 0,
            "por_status_iucn": {},
        }

    status_counts: dict[str, int] = defaultdict(int)
    for row in rows:
        if row.status_iucn:
            status_counts[row.status_iucn] += 1

    return {
        "total_ocorrencias": len(rows),
        "total_especies": len({row.nome_cientifico for row in rows}),
        "media_habitat_afetado": round(
            sum(row.habitat_afetado_pct or 0 for row in rows) / len(rows), 2
        ),
        "por_status_iucn": dict(sorted(status_counts.items(), key=lambda item: item[0])),
    }


def get_fauna_species(
    db: Session,
    estado: str | None = None,
    bioma: str | None = None,
    grupo: str | None = None,
    status_iucn: str | None = None,
) -> list[dict[str, float | str | dict[str, float]]]:
    """
    Retorna lista de especies com localizacao media.

    Args:
        db: Sessão do banco
        estado: Filtro por estado
        bioma: Filtro por bioma
        grupo: Filtro por grupo
        status_iucn: Filtro por status IUCN

    Returns:
        Lista de dicionarios com dados das especies
    """
    query = select(FaunaOccurrence)

    if estado:
        query = query.where(func.lower(FaunaOccurrence.estado) == func.lower(estado))
    if bioma:
        query = query.where(func.lower(FaunaOccurrence.bioma) == func.lower(bioma))
    if grupo:
        query = query.where(func.lower(FaunaOccurrence.grupo) == func.lower(grupo))
    if status_iucn:
        query = query.where(func.lower(FaunaOccurrence.status_iucn) == func.lower(status_iucn))

    rows = db.execute(query).scalars().all()

    species_map: dict[str, list[FaunaOccurrence]] = defaultdict(list)
    for row in rows:
        species_map[row.nome_cientifico].append(row)

    output: list[dict[str, float | str | dict[str, float]]] = []
    for items in species_map.values():
        first = items[0]
        avg_lat = sum(item.latitude or 0 for item in items) / len(items)
        avg_lng = sum(item.longitude or 0 for item in items) / len(items)
        avg_habitat = sum(item.habitat_afetado_pct or 0 for item in items) / len(items)
        output.append(
            {
                "nome_cientifico": first.nome_cientifico,
                "nome_popular": first.nome_popular or "",
                "grupo": first.grupo or "",
                "status": first.status_iucn or "",
                "bioma": first.bioma or "",
                "percentualAfetado": round(avg_habitat, 2),
                "location": {"lat": round(avg_lat, 6), "lng": round(avg_lng, 6)},
            }
        )

    output.sort(key=lambda item: (item.get("nome_popular", ""), item.get("nome_cientifico", "")))
    return output
