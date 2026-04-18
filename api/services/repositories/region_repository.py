"""
Repository de operacoes de banco de dados para regiao e focos.

Camada de acesso a dados com operacoes de upsert idempotentes.
"""

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from models.entities import FireEvent, Region, RiskSnapshot
from services.ingestion.file_loaders import FocoRecord
from services.ingestion.normalizers import state_coordinates


def build_region_coordinates(record: FocoRecord) -> tuple[float, float]:
    """
    Retorna coordenadas (latitude, longitude) para um registro de foco.

    Args:
        record: FocoRecord com estado para lookup

    Returns:
        Tupla (latitude, longitude) do estado
    """
    return state_coordinates(record.estado)


def upsert_region(db: Session, record: FocoRecord) -> Region:
    """
    Cria ou atualiza uma regiao no banco de forma idempotente.

    Args:
        db: Sessão do banco
        record: FocoRecord com dados da regiao

    Returns:
        Region criada ou existente

    Raises:
        RuntimeError: Se regiao nao puder ser localizada apos upsert
    """
    latitude, longitude = build_region_coordinates(record)
    statement = (
        pg_insert(Region)
        .values(
            estado=record.estado,
            municipio=record.municipio,
            bioma_predominante=record.bioma or None,
            latitude=latitude,
            longitude=longitude,
        )
        .on_conflict_do_nothing(index_elements=[Region.estado, Region.municipio])
        .returning(Region.id)
    )

    inserted_id = db.execute(statement).scalar_one_or_none()
    if inserted_id is not None:
        return db.scalar(select(Region).where(Region.id == inserted_id))

    existing = db.scalar(
        select(Region).where(
            func.upper(Region.estado) == record.estado.upper(),
            func.upper(Region.municipio) == record.municipio.upper(),
        )
    )
    if existing is None:
        raise RuntimeError(f"Nao foi possivel localizar a regiao {record.estado} / {record.municipio}")

    if existing.bioma_predominante is None and record.bioma:
        existing.bioma_predominante = record.biomaclear
    if existing.latitude is None or existing.longitude is None:
        existing.latitude = latitude
        existing.longitude = longitude
    return existing


def upsert_fire_event(db: Session, region_id: int, record: FocoRecord) -> FireEvent:
    """
    Cria ou atualiza um evento de fogo no banco de forma idempotente.

    Args:
        db: Sessão do banco
        region_id: ID da regiao associada
        record: FocoRecord com dados do evento

    Returns:
        FireEvent criado ou existente

    Raises:
        RuntimeError: Se evento nao puder ser localizado apos upsert
    """
    statement = (
        pg_insert(FireEvent)
        .values(
            region_id=region_id,
            ano=record.ano,
            mes=record.mes,
            ano_mes=record.ano_mes,
            quantidade_focos=record.quantidade_focos,
            risco_fogo_mediano=record.risco_fogo_mediano,
            frp_mediano=record.frp_mediano,
        )
        .on_conflict_do_update(
            index_elements=[FireEvent.region_id, FireEvent.ano_mes],
            set_={
                "ano": record.ano,
                "mes": record.mes,
                "quantidade_focos": record.quantidade_focos,
                "risco_fogo_mediano": record.risco_fogo_mediano,
                "frp_mediano": record.frp_mediano,
            },
        )
        .returning(FireEvent.id)
    )

    event_id = db.execute(statement).scalar_one_or_none()
    if event_id is None:
        existing_event = db.scalar(
            select(FireEvent).where(FireEvent.region_id == region_id, FireEvent.ano_mes == record.ano_mes)
        )
        if existing_event is None:
            raise RuntimeError(f"Nao foi possivel localizar o evento {region_id} / {record.ano_mes}")
        return existing_event

    return db.scalar(select(FireEvent).where(FireEvent.id == event_id))


def upsert_risk_snapshot(
    db: Session,
    region_id: int,
    record: FocoRecord,
    score: float,
    risco: str,
    score_amanha: float,
    risco_amanha: str,
    tendencia: str,
) -> RiskSnapshot:
    """
    Cria ou atualiza um snapshot de risco no banco de forma idempotente.

    Args:
        db: Sessão do banco
        region_id: ID da regiao
        record: FocoRecord para periodo
        score: Score de risco calculado
        risco: Classificacao de risco (baixo/medio/alto)
        score_amanha: Score previsto para amanha
        risco_amanha: Classificacao prevista para amanha
        tendencia: Tendencia (crescente/decrescente/estavel)

    Returns:
        RiskSnapshot criado ou existente

    Raises:
        RuntimeError: Se snapshot nao puder ser localizado apos upsert
    """
    statement = (
        pg_insert(RiskSnapshot)
        .values(
            region_id=region_id,
            ano_mes=record.ano_mes,
            score=score,
            risco=risco,
            score_amanha=score_amanha,
            risco_amanha=risco_amanha,
            tendencia=tendencia,
        )
        .on_conflict_do_update(
            index_elements=[RiskSnapshot.region_id, RiskSnapshot.ano_mes],
            set_={
                "score": score,
                "risco": risco,
                "score_amanha": score_amanha,
                "risco_amanha": risco_amanha,
                "tendencia": tendencia,
            },
        )
        .returning(RiskSnapshot.id)
    )

    snapshot_id = db.execute(statement).scalar_one_or_none()
    if snapshot_id is None:
        existing_snapshot = db.scalar(
            select(RiskSnapshot).where(RiskSnapshot.region_id == region_id, RiskSnapshot.ano_mes == record.ano_mes)
        )
        if existing_snapshot is None:
            raise RuntimeError(f"Nao foi possivel localizar o risco {region_id} / {record.ano_mes}")
        return existing_snapshot

    return db.scalar(select(RiskSnapshot).where(RiskSnapshot.id == snapshot_id))
