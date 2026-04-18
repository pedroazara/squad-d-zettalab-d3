from dataclasses import dataclass

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
from services.risk_service import (
    AggregateRiskInput,
    calculate_aggregate_risk_score,
    classify_risk,
    forecast_tendency,
)
from sqlalchemy.dialects.postgresql import insert as pg_insert


@dataclass(frozen=True)
class RegionContext:
    region_id: int
    estado: str
    municipio: str
    ano: int
    mes: int
    ano_mes: str
    quantidade_focos: int
    risco_fogo_mediano: float
    frp_mediano: float
    bioma: str | None

    @property
    def nome(self) -> str:
        return f"{self.municipio} - {self.estado} ({self.ano_mes})"


def _build_region_snapshot(region: RegionContext) -> dict[str, float | int | str]:
    base_lat, base_lng = state_coordinates(region.estado)
    offset = (region.region_id % 9) * 0.03
    temperatura = round(24 + (region.risco_fogo_mediano * 12) + (region.frp_mediano / 180), 1)
    umidade = round(max(12.0, 75 - (region.risco_fogo_mediano * 50)), 1)
    vento = round(6 + min(24.0, region.frp_mediano / 12), 1)
    precipitacao = round(max(0.0, 120 - (region.risco_fogo_mediano * 110)), 1)

    return {
        "id": region.region_id,
        "nome": region.nome,
        "latitude": round(base_lat + offset, 4),
        "longitude": round(base_lng - offset, 4),
        "temperatura": temperatura,
        "umidade": umidade,
        "vento": vento,
        "precipitacao": precipitacao,
        "focos_calor": region.quantidade_focos,
    }


def _build_region_snapshot_with_climate(
    region: RegionContext,
    avg_temp: float | None,
    avg_humidity: float | None,
    avg_precipitation: float | None,
) -> dict[str, float | int | str]:
    snapshot = _build_region_snapshot(region)
    offset = ((region.region_id % 5) - 2) * 0.4

    if avg_temp is not None:
        snapshot["temperatura"] = round(avg_temp + offset, 1)
    if avg_humidity is not None:
        snapshot["umidade"] = round(max(5.0, min(100.0, avg_humidity - (offset * 2))), 1)
    if avg_precipitation is not None:
        snapshot["precipitacao"] = round(max(0.0, avg_precipitation - (offset * 3)), 1)

    return snapshot




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


def list_region_snapshots(db: Session) -> list[dict[str, float | int | str]]:
    regions = list_regions(db)
    if not regions:
        return []

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

    return [
        _build_region_snapshot_with_climate(region, avg_temp, avg_humidity, avg_precipitation)
        for region in regions
    ]


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


def build_risk_payload(region: RegionContext) -> dict[str, object]:
    current_score = calculate_aggregate_risk_score(
        AggregateRiskInput(
            quantidade_focos=region.quantidade_focos,
            risco_fogo_mediano=region.risco_fogo_mediano,
            frp_mediano=region.frp_mediano,
        )
    )

    tomorrow_score = calculate_aggregate_risk_score(
        AggregateRiskInput(
            quantidade_focos=max(1, round(region.quantidade_focos * 1.15)),
            risco_fogo_mediano=min(1.0, region.risco_fogo_mediano + 0.05),
            frp_mediano=region.frp_mediano * 1.1,
        )
    )

    return {
        "regiao_id": region.region_id,
        "regiao_nome": region.nome,
        "score": current_score,
        "risco": classify_risk(current_score),
        "score_amanha": tomorrow_score,
        "risco_amanha": classify_risk(tomorrow_score),
        "tendencia": forecast_tendency(current_score, tomorrow_score),
    }


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

    query = query.order_by(RiskSnapshot.ano_mes.desc(), Region.estado, Region.municipio).offset(offset).limit(limit)

    payloads: list[dict[str, object]] = []
    for region, snapshot in db.execute(query).all():
        payloads.append(
            {
                "regiao_id": region.id,
                "regiao_nome": f"{region.municipio} - {region.estado} ({snapshot.ano_mes})",
                "score": snapshot.score,
                "risco": snapshot.risco,
                "score_amanha": snapshot.score_amanha,
                "risco_amanha": snapshot.risco_amanha,
                "tendencia": snapshot.tendencia,
            }
        )

    return payloads


def list_fire_items(
    db: Session,
    ano_mes: str | None = None,
    estado: str | None = None,
    municipio: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[dict[str, object]]:
    query = select(Region, FireEvent).join(FireEvent, FireEvent.region_id == Region.id)

    if ano_mes is not None:
        query = query.where(FireEvent.ano_mes == ano_mes)

    if estado is not None:
        query = query.where(func.upper(Region.estado) == estado.strip().upper())

    if municipio is not None:
        query = query.where(func.upper(Region.municipio) == municipio.strip().upper())

    query = query.order_by(FireEvent.ano_mes.desc(), Region.estado, Region.municipio).offset(offset).limit(limit)

    records: list[dict[str, object]] = []
    for region, fire_event in db.execute(query).all():
        score = calculate_aggregate_risk_score(
            AggregateRiskInput(
                quantidade_focos=fire_event.quantidade_focos,
                risco_fogo_mediano=fire_event.risco_fogo_mediano,
                frp_mediano=fire_event.frp_mediano,
            )
        )
        records.append(
            {
                "id": fire_event.id,
                "estado": region.estado,
                "municipio": region.municipio,
                "ano_mes": fire_event.ano_mes,
                "quantidade_focos": fire_event.quantidade_focos,
                "risco_fogo_mediano": fire_event.risco_fogo_mediano,
                "frp_mediano": fire_event.frp_mediano,
                "score": score,
                "risco": classify_risk(score),
            }
        )

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

    if ano_mes is not None:
        query = query.where(FirePoint.ano_mes == ano_mes)

    if estado is not None:
        query = query.where(func.upper(FirePoint.estado) == estado.strip().upper())

    if municipio is not None:
        query = query.where(func.upper(FirePoint.municipio) == municipio.strip().upper())

    query = query.order_by(FirePoint.ano_mes.desc(), FirePoint.estado, FirePoint.municipio, FirePoint.id).offset(offset).limit(limit)

    records: list[dict[str, object]] = []
    for item in db.execute(query).scalars().all():
        records.append(
            {
                "id": item.id,
                "data_hora": item.data_hora,
                "satelite": item.satelite,
                "estado": item.estado,
                "municipio": item.municipio,
                "bioma": item.bioma,
                "risco_fogo": item.risco_fogo,
                "frp": item.frp,
                "latitude": item.latitude,
                "longitude": item.longitude,
                "ano_mes": item.ano_mes,
            }
        )

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

    if estacao_codigo is not None:
        query = query.where(func.upper(ClimateMonthly.estacao_codigo) == estacao_codigo.strip().upper())

    query = query.order_by(ClimateMonthly.ano.desc(), ClimateMonthly.mes.desc(), ClimateMonthly.estacao_codigo).offset(offset).limit(limit)

    records: list[dict[str, object]] = []
    for item in db.execute(query).scalars().all():
        temp_media = None
        if item.temp_max_c is not None and item.temp_min_c is not None:
            temp_media = round((item.temp_max_c + item.temp_min_c) / 2.0, 2)

        records.append(
            {
                "estacao_codigo": item.estacao_codigo,
                "ano": item.ano,
                "mes": item.mes,
                "temp_max_c": item.temp_max_c,
                "temp_min_c": item.temp_min_c,
                "temp_media_c": temp_media,
                "umidade_min_pct": item.umidade_min_pct,
                "precipitacao_mm": item.precipitacao_mm,
            }
        )

    return records
