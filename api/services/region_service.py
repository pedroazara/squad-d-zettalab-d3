from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from models.entities import (
    BurnScarAnnual,
    BurnScarMonthly,
    ClimateMonthly,
    CrossRiskHistorical,
    FireEvent,
    FirePoint,
    PastureRisk,
    Region,
    RiskSnapshot,
)
from services.ingestion.file_loaders import (
    FocoRecord,
    load_burn_scar_annual_records,
    load_burn_scar_monthly_records,
    load_climate_records,
    load_cross_risk_records,
    load_fire_point_records,
    load_pasture_risk_records,
    load_records,
    load_state_risk_records,
)
from services.ingestion.normalizers import normalize_key, state_coordinates
from services.repositories.region_repository import (
    upsert_fire_event,
    upsert_region,
    upsert_risk_snapshot,
)
from services.risk_hybrid_service import (
    hybrid_score,
    load_hybrid_support_index,
    score_for_state_risk,
)
from services.region_presenter import (
    RegionContext,
    build_climate_item,
    build_fire_item,
    build_fire_point_item,
    build_region_snapshot_with_climate,
    build_risk_payload_from_snapshot,
)
from services.risk_service import AggregateRiskInput, calculate_aggregate_risk_score, classify_risk, forecast_tendency
from sqlalchemy.dialects.postgresql import insert as pg_insert


def _apply_optional_text_filter(query, column, value: str | None):
    if value is None:
        return query

    return query.where(func.upper(column) == value.strip().upper())


def _apply_optional_text_filters(query, filters: list[tuple[object, str | None]]):
    for column, value in filters:
        query = _apply_optional_text_filter(query, column, value)
    return query


def _paginate_and_order(query, order_by_columns, limit: int, offset: int):
    return query.order_by(*order_by_columns).offset(offset).limit(limit)


def _fire_score(fire_event: FireEvent) -> float:
    return calculate_aggregate_risk_score(
        AggregateRiskInput(
            quantidade_focos=fire_event.quantidade_focos,
            risco_fogo_mediano=fire_event.risco_fogo_mediano,
            frp_mediano=fire_event.frp_mediano,
        )
    )


def sync_foco_dataset(db: Session) -> None:
    records = load_records()
    support_index = load_hybrid_support_index()

    state_risk_lookup: dict[str, tuple[float, str]] = {}
    for item in load_state_risk_records():
        state_risk_lookup[normalize_key(item.estado)] = score_for_state_risk(item.risco_geral)

    region_lookup: dict[tuple[str, str], Region] = {}

    for record in records:
        key = (record.estado.upper(), record.municipio.upper())
        region = region_lookup.get(key)

        if region is None:
            region = upsert_region(db, record)
            region_lookup[key] = region
        else:
            if region.bioma_predominante is None and record.bioma:
                region.bioma_predominante = record.bioma
            if region.latitude is None or region.longitude is None:
                latitude, longitude = state_coordinates(record.estado)
                region.latitude = latitude
                region.longitude = longitude

        upsert_fire_event(db, region.id, record)
        upsert_risk_snapshot(db, region.id, record, support_index, state_risk_lookup)

    db.commit()


def sync_climate_dataset(db: Session) -> None:
    records = load_climate_records()

    for record in records:
        statement = (
            pg_insert(ClimateMonthly)
            .values(
                estacao_codigo=record.estacao_codigo,
                ano=record.ano,
                mes=record.mes,
                temp_max_c=record.temp_max_c,
                temp_min_c=record.temp_min_c,
                umidade_min_pct=record.umidade_min_pct,
                precipitacao_mm=record.precipitacao_mm,
            )
            .on_conflict_do_update(
                index_elements=[ClimateMonthly.estacao_codigo, ClimateMonthly.ano, ClimateMonthly.mes],
                set_={
                    "temp_max_c": record.temp_max_c,
                    "temp_min_c": record.temp_min_c,
                    "umidade_min_pct": record.umidade_min_pct,
                    "precipitacao_mm": record.precipitacao_mm,
                },
            )
        )
        db.execute(statement)

    db.commit()


def sync_burn_scar_dataset(db: Session) -> None:
    monthly_records = load_burn_scar_monthly_records()
    annual_records = load_burn_scar_annual_records()

    for record in monthly_records:
        statement = (
            pg_insert(BurnScarMonthly)
            .values(
                estado=record.estado,
                bioma=record.bioma,
                ano=record.ano,
                mes=record.mes,
                area_queimada_ha=record.area_queimada_ha,
            )
            .on_conflict_do_update(
                index_elements=[BurnScarMonthly.estado, BurnScarMonthly.bioma, BurnScarMonthly.ano, BurnScarMonthly.mes],
                set_={"area_queimada_ha": record.area_queimada_ha},
            )
        )
        db.execute(statement)

    for record in annual_records:
        statement = (
            pg_insert(BurnScarAnnual)
            .values(
                estado=record.estado,
                bioma=record.bioma,
                ano=record.ano,
                area_queimada_ha=record.area_queimada_ha,
            )
            .on_conflict_do_update(
                index_elements=[BurnScarAnnual.estado, BurnScarAnnual.bioma, BurnScarAnnual.ano],
                set_={"area_queimada_ha": record.area_queimada_ha},
            )
        )
        db.execute(statement)

    db.commit()


def sync_pasture_risk_dataset(db: Session) -> None:
    records = load_pasture_risk_records()

    for record in records:
        statement = (
            pg_insert(PastureRisk)
            .values(
                estado=record.estado,
                uf=record.uf,
                bioma=record.bioma,
                ano=record.ano,
                area_pastagem_risco_ha=record.area_pastagem_risco_ha,
            )
            .on_conflict_do_update(
                index_elements=[PastureRisk.estado, PastureRisk.bioma, PastureRisk.ano],
                set_={
                    "uf": record.uf,
                    "area_pastagem_risco_ha": record.area_pastagem_risco_ha,
                },
            )
        )
        db.execute(statement)

    db.commit()


def sync_cross_risk_dataset(db: Session) -> None:
    records = load_cross_risk_records()

    for record in records:
        statement = (
            pg_insert(CrossRiskHistorical)
            .values(
                estado=record.estado,
                uf=record.uf,
                bioma=record.bioma,
                ano=record.ano,
                area_queimada_ha=record.area_queimada_ha,
                area_pastagem_risco_ha=record.area_pastagem_risco_ha,
                perc_pastagem_queimada=record.perc_pastagem_queimada,
                nivel_risco_historico=record.nivel_risco_historico,
            )
            .on_conflict_do_update(
                index_elements=[CrossRiskHistorical.estado, CrossRiskHistorical.bioma, CrossRiskHistorical.ano],
                set_={
                    "uf": record.uf,
                    "area_queimada_ha": record.area_queimada_ha,
                    "area_pastagem_risco_ha": record.area_pastagem_risco_ha,
                    "perc_pastagem_queimada": record.perc_pastagem_queimada,
                    "nivel_risco_historico": record.nivel_risco_historico,
                },
            )
        )
        db.execute(statement)

    db.commit()


def sync_fire_points_dataset(db: Session) -> None:
    records = load_fire_point_records()
    if not records:
        return

    for record in records:
        statement = (
            pg_insert(FirePoint)
            .values(
                data_hora=record.data_hora,
                satelite=record.satelite,
                estado=record.estado,
                municipio=record.municipio,
                bioma=record.bioma,
                risco_fogo=record.risco_fogo,
                frp=record.frp,
                latitude=record.latitude,
                longitude=record.longitude,
                ano_mes=record.ano_mes,
            )
            .on_conflict_do_update(
                index_elements=[FirePoint.data_hora, FirePoint.satelite, FirePoint.latitude, FirePoint.longitude],
                set_={
                    "estado": record.estado,
                    "municipio": record.municipio,
                    "bioma": record.bioma,
                    "risco_fogo": record.risco_fogo,
                    "frp": record.frp,
                    "ano_mes": record.ano_mes,
                },
            )
        )
        db.execute(statement)

    db.commit()


def sync_state_risk_dataset(db: Session) -> None:
    records = load_state_risk_records()
    if not records:
        return

    severity_order = {"baixo": 1, "medio": 2, "alto": 3}
    state_levels: dict[str, tuple[float, str]] = {}
    for record in records:
        state_key = normalize_key(record.estado)
        score, risco = score_for_state_risk(record.risco_geral)
        current = state_levels.get(state_key)
        if current is None or severity_order[risco] > severity_order[current[1]]:
            state_levels[state_key] = (score, risco)

    latest_period_by_region = {
        region_id: ano_mes
        for region_id, ano_mes in db.execute(
            select(FireEvent.region_id, func.max(FireEvent.ano_mes)).group_by(FireEvent.region_id)
        ).all()
        if ano_mes is not None
    }

    if not latest_period_by_region:
        return

    regions = db.execute(select(Region)).scalars().all()
    for region in regions:
        latest_period = latest_period_by_region.get(region.id)
        if latest_period is None:
            continue

        risk_data = state_levels.get(normalize_key(region.estado))
        if risk_data is None:
            continue

        score, risco = risk_data
        statement = (
            pg_insert(RiskSnapshot)
            .values(
                region_id=region.id,
                ano_mes=latest_period,
                score=score,
                risco=risco,
                score_amanha=score,
                risco_amanha=risco,
                tendencia="estavel",
            )
            .on_conflict_do_nothing(index_elements=[RiskSnapshot.region_id, RiskSnapshot.ano_mes])
        )
        db.execute(statement)

    db.commit()


def _context_from_row(region: Region, fire_event: FireEvent) -> RegionContext:
    return RegionContext(
        region_id=region.id,
        estado=region.estado,
        municipio=region.municipio,
        ano=fire_event.ano,
        mes=fire_event.mes,
        ano_mes=fire_event.ano_mes,
        quantidade_focos=fire_event.quantidade_focos,
        risco_fogo_mediano=fire_event.risco_fogo_mediano,
        frp_mediano=fire_event.frp_mediano,
        bioma=region.bioma_predominante,
    )


def list_regions(db: Session, ano_mes: str | None = None) -> list[RegionContext]:
    query = select(Region, FireEvent).join(FireEvent, FireEvent.region_id == Region.id)

    if ano_mes is not None:
        query = query.where(FireEvent.ano_mes == ano_mes)

    query = query.order_by(FireEvent.ano_mes, Region.estado, Region.municipio)

    return [_context_from_row(region, fire_event) for region, fire_event in db.execute(query).all()]


def list_region_snapshots(
    db: Session,
    limit: int = 100,
    offset: int = 0,
    ano_mes: str | None = None,
) -> list[dict[str, float | int | str]]:
    regions = list_regions(db, ano_mes)
    if not regions:
        return []

    avg_temp, avg_humidity, avg_precipitation = _latest_climate_averages(db)

    snapshots = [
        build_region_snapshot_with_climate(
            region,
            *state_coordinates(region.estado),
            avg_temp,
            avg_humidity,
            avg_precipitation,
        )
        for region in regions
    ]

    return snapshots[offset : offset + limit]


def _latest_climate_averages(db: Session) -> tuple[float | None, float | None, float | None]:
    latest_period = db.execute(select(func.max(ClimateMonthly.ano), func.max(ClimateMonthly.mes))).first()
    avg_temp = None
    avg_humidity = None
    avg_precipitation = None

    if latest_period is not None:
        climate_year, climate_month = latest_period
        if climate_year is not None and climate_month is not None:
            climate_agg = db.execute(
                select(
                    func.avg(ClimateMonthly.temp_max_c),
                    func.avg(ClimateMonthly.umidade_min_pct),
                    func.avg(ClimateMonthly.precipitacao_mm),
                ).where(ClimateMonthly.ano == climate_year, ClimateMonthly.mes == climate_month)
            ).first()
            if climate_agg is not None:
                avg_temp, avg_humidity, avg_precipitation = climate_agg

    return avg_temp, avg_humidity, avg_precipitation


def get_region_snapshot(db: Session, region_id: int, ano_mes: str | None = None) -> dict[str, float | int | str] | None:
    region = get_region(db, region_id, ano_mes)
    if region is None:
        return None

    avg_temp, avg_humidity, avg_precipitation = _latest_climate_averages(db)

    return build_region_snapshot_with_climate(
        region,
        *state_coordinates(region.estado),
        avg_temp,
        avg_humidity,
        avg_precipitation,
    )


def get_risk_payload(db: Session, region_id: int, ano_mes: str | None = None) -> dict[str, object] | None:
    payloads = list_risk_payloads(db, region_id, ano_mes, limit=1, offset=0)
    if not payloads:
        return None

    return payloads[0]


def get_region(db: Session, region_id: int, ano_mes: str | None = None) -> RegionContext | None:
    query = select(Region, FireEvent).join(FireEvent, FireEvent.region_id == Region.id).where(Region.id == region_id)

    if ano_mes is not None:
        query = query.where(FireEvent.ano_mes == ano_mes)
    else:
        query = query.order_by(desc(FireEvent.ano_mes))

    row = db.execute(query.limit(1)).first()
    if row is None:
        return None

    region, fire_event = row
    return _context_from_row(region, fire_event)


def list_risk_payloads(
    db: Session,
    region_id: int | None = None,
    ano_mes: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[dict[str, object]]:
    query = select(Region, RiskSnapshot).join(RiskSnapshot, RiskSnapshot.region_id == Region.id)

    if region_id is not None:
        query = query.where(Region.id == region_id)

    if ano_mes is not None:
        query = query.where(RiskSnapshot.ano_mes == ano_mes)

    query = _paginate_and_order(query, [RiskSnapshot.ano_mes.desc(), Region.estado, Region.municipio], limit, offset)

    payloads: list[dict[str, object]] = []
    for region, snapshot in db.execute(query).all():
        payloads.append(build_risk_payload_from_snapshot(region, snapshot))

    return payloads


def get_fire_item(db: Session, fire_event_id: int) -> dict[str, object] | None:
    fire_event = db.get(FireEvent, fire_event_id)
    if fire_event is None:
        return None

    region = db.get(Region, fire_event.region_id)
    if region is None:
        return None

    score = _fire_score(fire_event)
    return build_fire_item(region, fire_event, score, classify_risk(score))


def get_fire_point_item(db: Session, point_id: int) -> dict[str, object] | None:
    item = db.get(FirePoint, point_id)
    if item is None:
        return None

    return build_fire_point_item(item)


def get_climate_item(db: Session, climate_id: int) -> dict[str, object] | None:
    item = db.get(ClimateMonthly, climate_id)
    if item is None:
        return None

    temp_media = None
    if item.temp_max_c is not None and item.temp_min_c is not None:
        temp_media = round((item.temp_max_c + item.temp_min_c) / 2.0, 2)

    return build_climate_item(item, temp_media)


def list_fire_items(
    db: Session,
    ano_mes: str | None = None,
    estado: str | None = None,
    municipio: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[dict[str, object]]:
    query = select(Region, FireEvent).join(FireEvent, FireEvent.region_id == Region.id)

    query = _apply_optional_text_filters(
        query,
        [
            (FireEvent.ano_mes, ano_mes),
            (Region.estado, estado),
            (Region.municipio, municipio),
        ],
    )
    query = _paginate_and_order(query, [FireEvent.ano_mes.desc(), Region.estado, Region.municipio], limit, offset)

    records: list[dict[str, object]] = []
    for region, fire_event in db.execute(query).all():
        score = _fire_score(fire_event)
        records.append(build_fire_item(region, fire_event, score, classify_risk(score)))

    return records


def list_fire_point_items(
    db: Session,
    ano_mes: str | None = None,
    estado: str | None = None,
    municipio: str | None = None,
    limit: int = 1000,
    offset: int = 0,
) -> list[dict[str, object]]:
    query = select(FirePoint)

    query = _apply_optional_text_filters(
        query,
        [
            (FirePoint.ano_mes, ano_mes),
            (FirePoint.estado, estado),
            (FirePoint.municipio, municipio),
        ],
    )
    query = _paginate_and_order(query, [FirePoint.ano_mes.desc(), FirePoint.estado, FirePoint.municipio, FirePoint.id], limit, offset)

    records: list[dict[str, object]] = []
    for item in db.execute(query).scalars().all():
        records.append(build_fire_point_item(item))

    return records


def list_climate_items(
    db: Session,
    ano: int | None = None,
    mes: int | None = None,
    estacao_codigo: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[dict[str, object]]:
    query = select(ClimateMonthly)

    if ano is not None:
        query = query.where(ClimateMonthly.ano == ano)

    if mes is not None:
        query = query.where(ClimateMonthly.mes == mes)

    query = _apply_optional_text_filter(query, ClimateMonthly.estacao_codigo, estacao_codigo)
    query = _paginate_and_order(query, [ClimateMonthly.ano.desc(), ClimateMonthly.mes.desc(), ClimateMonthly.estacao_codigo], limit, offset)

    records: list[dict[str, object]] = []
    for item in db.execute(query).scalars().all():
        temp_media = None
        if item.temp_max_c is not None and item.temp_min_c is not None:
            temp_media = round((item.temp_max_c + item.temp_min_c) / 2.0, 2)

        records.append(build_climate_item(item, temp_media))

    return records
