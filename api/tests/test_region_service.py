from types import SimpleNamespace

import pytest

from models.entities import ClimateMonthly, FireEvent, FirePoint, Region, RiskSnapshot
from services import region_service
from services.ingestion.file_loaders import FocoRecord


class FakeInsertStatement:
    def __init__(self, model):
        self.model = model
        self.payload = None
        self.conflict_action = None
        self.returning_columns = None

    def values(self, **kwargs):
        self.payload = kwargs
        return self

    def on_conflict_do_update(self, **kwargs):
        self.conflict_action = ("update", kwargs)
        return self

    def on_conflict_do_nothing(self, **kwargs):
        self.conflict_action = ("nothing", kwargs)
        return self

    def returning(self, *columns):
        self.returning_columns = columns
        return self


class FakeDb:
    def __init__(self):
        self.executed = []
        self.commit_calls = 0

    def execute(self, statement):
        self.executed.append(statement)
        return SimpleNamespace()

    def commit(self):
        self.commit_calls += 1


class SessionProxy:
    def __init__(self, session):
        self.session = session
        self.executed = []

    def execute(self, statement):
        if isinstance(statement, FakeInsertStatement):
            self.executed.append(statement)
            return SimpleNamespace()
        return self.session.execute(statement)

    def commit(self):
        self.session.commit()


class InsertFactory:
    def __call__(self, model):
        return FakeInsertStatement(model)


@pytest.fixture
def fake_insert(monkeypatch):
    factory = InsertFactory()
    monkeypatch.setattr(region_service, "pg_insert", factory)
    return factory


def _create_region_with_event(test_db_session, *, state="MG", municipality="Lavras", ano_mes="2024-08", quantity=12):
    region = Region(
        estado=state,
        municipio=municipality,
        bioma_predominante="Cerrado",
        latitude=-21.0,
        longitude=-44.0,
    )
    test_db_session.add(region)
    test_db_session.commit()
    test_db_session.refresh(region)

    fire_event = FireEvent(
        region_id=region.id,
        ano=2024,
        mes=8,
        ano_mes=ano_mes,
        quantidade_focos=quantity,
        risco_fogo_mediano=0.42,
        frp_mediano=18.0,
    )
    test_db_session.add(fire_event)
    test_db_session.commit()
    test_db_session.refresh(fire_event)
    return region, fire_event


def test_list_regions_and_get_region(test_db_session):
    region, fire_event = _create_region_with_event(test_db_session)
    newer_event = FireEvent(
        region_id=region.id,
        ano=2024,
        mes=9,
        ano_mes="2024-09",
        quantidade_focos=18,
        risco_fogo_mediano=0.6,
        frp_mediano=24.0,
    )
    test_db_session.add(newer_event)
    test_db_session.commit()
    test_db_session.refresh(newer_event)

    regions = region_service.list_regions(test_db_session)
    assert len(regions) >= 2
    assert any(item.region_id == region.id and item.ano_mes == fire_event.ano_mes for item in regions)

    filtered = region_service.list_regions(test_db_session, ano_mes="2024-09")
    assert len(filtered) >= 1
    assert all(item.ano_mes == "2024-09" for item in filtered)

    latest = region_service.get_region(test_db_session, region.id)
    assert latest is not None
    assert latest.ano_mes == newer_event.ano_mes

    specific = region_service.get_region(test_db_session, region.id, ano_mes="2024-08")
    assert specific is not None
    assert specific.ano_mes == "2024-08"


def test_list_region_snapshots_uses_climate_aggregate(test_db_session):
    region, _ = _create_region_with_event(test_db_session, state="GO", municipality="Goiania")
    test_db_session.add_all(
        [
            ClimateMonthly(estacao_codigo="A001", ano=2024, mes=7, temp_max_c=34.0, temp_min_c=22.0, umidade_min_pct=30.0, precipitacao_mm=1.0),
            ClimateMonthly(estacao_codigo="A002", ano=2024, mes=7, temp_max_c=32.0, temp_min_c=20.0, umidade_min_pct=40.0, precipitacao_mm=3.0),
            ClimateMonthly(estacao_codigo="A003", ano=2023, mes=6, temp_max_c=30.0, temp_min_c=18.0, umidade_min_pct=50.0, precipitacao_mm=4.0),
        ]
    )
    test_db_session.commit()

    snapshots = region_service.list_region_snapshots(test_db_session)

    assert snapshots
    payload = next(item for item in snapshots if item["id"] == region.id)
    assert payload["nome"] == f"{region.municipio} - {region.estado} (2024-08)"
    assert payload["temperatura"] == pytest.approx(32.6)
    assert payload["umidade"] == pytest.approx(35.8)
    assert payload["precipitacao"] == pytest.approx(3.2)
    assert payload["focos_calor"] == 12


def test_list_risk_payloads_and_fire_items_and_points_and_climate(test_db_session):
    region, fire_event = _create_region_with_event(test_db_session, state="SP", municipality="Campinas", ano_mes="2024-11", quantity=20)
    second_region, _ = _create_region_with_event(test_db_session, state="GO", municipality="Rio Verde", ano_mes="2024-11", quantity=9)

    test_db_session.add_all(
        [
            RiskSnapshot(
                region_id=region.id,
                ano_mes="2024-11",
                score=73.2,
                risco="alto",
                score_amanha=70.5,
                risco_amanha="alto",
                tendencia="decrescente",
            ),
            RiskSnapshot(
                region_id=second_region.id,
                ano_mes="2024-11",
                score=44.0,
                risco="medio",
                score_amanha=46.0,
                risco_amanha="medio",
                tendencia="estavel",
            ),
            FirePoint(
                data_hora="2024-11-12T10:00:00",
                satelite="AQUA",
                estado="SP",
                municipio="Campinas",
                bioma="Mata Atlantica",
                risco_fogo=0.8,
                frp=16.0,
                latitude=-22.9,
                longitude=-47.0,
                ano_mes="2024-11",
            ),
            FirePoint(
                data_hora="2024-11-13T11:00:00",
                satelite="TERRA",
                estado="GO",
                municipio="Rio Verde",
                bioma="Cerrado",
                risco_fogo=0.6,
                frp=12.0,
                latitude=-17.8,
                longitude=-50.9,
                ano_mes="2024-11",
            ),
            ClimateMonthly(
                estacao_codigo="A111",
                ano=2024,
                mes=11,
                temp_max_c=35.0,
                temp_min_c=21.0,
                umidade_min_pct=18.0,
                precipitacao_mm=2.0,
            ),
            ClimateMonthly(
                estacao_codigo="A222",
                ano=2024,
                mes=11,
                temp_max_c=33.0,
                temp_min_c=23.0,
                umidade_min_pct=22.0,
                precipitacao_mm=1.0,
            ),
        ]
    )
    test_db_session.commit()

    risk_payloads = region_service.list_risk_payloads(test_db_session, region_id=region.id)
    fire_items = region_service.list_fire_items(test_db_session, ano_mes="2024-11")
    fire_points = region_service.list_fire_point_items(test_db_session, estado="go")
    climate_items = region_service.list_climate_items(test_db_session, ano=2024, mes=11)

    assert len(risk_payloads) == 1
    assert risk_payloads[0]["regiao_nome"] == f"{region.municipio} - {region.estado} (2024-11)"
    assert risk_payloads[0]["risco"] == "alto"

    assert len(fire_items) >= 2
    assert any(item["id"] == fire_event.id and item["risco"] in {"medio", "alto"} for item in fire_items)

    assert len(fire_points) == 1
    assert fire_points[0]["estado"] == "GO"
    assert fire_points[0]["bioma"] == "Cerrado"

    assert len(climate_items) == 2
    assert climate_items[0]["temp_media_c"] == pytest.approx(28.0)
    assert all(item["ano"] == 2024 and item["mes"] == 11 for item in climate_items)


def test_sync_foco_dataset_delegates_to_repository(monkeypatch):
    fake_db = FakeDb()
    records = [
        FocoRecord(
            estado="MG",
            municipio="Lavras",
            ano=2024,
            mes=8,
            ano_mes="2024-08",
            quantidade_focos=10,
            risco_fogo_mediano=0.4,
            frp_mediano=12.0,
            bioma="Cerrado",
        ),
        FocoRecord(
            estado="MG",
            municipio="Lavras",
            ano=2024,
            mes=8,
            ano_mes="2024-08",
            quantidade_focos=14,
            risco_fogo_mediano=0.5,
            frp_mediano=18.0,
            bioma="Cerrado",
        ),
    ]
    hybrid_index = object()
    region_object = SimpleNamespace(id=10, bioma_predominante=None, latitude=None, longitude=None)
    calls = []

    monkeypatch.setattr(region_service, "load_records", lambda: records)
    monkeypatch.setattr(region_service, "load_state_risk_records", lambda: [SimpleNamespace(estado="MG", risco_geral="alto")])
    monkeypatch.setattr(region_service, "load_hybrid_support_index", lambda: hybrid_index)
    monkeypatch.setattr(region_service, "upsert_region", lambda db, record: calls.append(("region", record.municipio)) or region_object)
    monkeypatch.setattr(region_service, "upsert_fire_event", lambda db, region_id, record: calls.append(("fire", region_id, record.quantidade_focos)))
    monkeypatch.setattr(region_service, "upsert_risk_snapshot", lambda db, region_id, record, support_index, lookup: calls.append(("risk", region_id, support_index is hybrid_index, lookup["MG"][1])))

    region_service.sync_foco_dataset(fake_db)

    assert fake_db.commit_calls == 1
    assert calls[0] == ("region", "Lavras")
    assert calls[1][0] == "fire"
    assert calls[2][0] == "risk"
    assert calls[3][0] == "fire"
    assert calls[4][0] == "risk"


@pytest.mark.parametrize(
    "sync_name, monthly_records, annual_records, expected_count",
    [
        (
            "sync_climate_dataset",
            [SimpleNamespace(estacao_codigo="A001", ano=2024, mes=7, temp_max_c=32.0, temp_min_c=20.0, umidade_min_pct=35.0, precipitacao_mm=1.2)],
            [],
            1,
        ),
        (
            "sync_burn_scar_dataset",
            [
                SimpleNamespace(estado="MG", bioma="Cerrado", ano=2024, mes=7, area_queimada_ha=120.0),
            ],
            [SimpleNamespace(estado="MG", bioma="Cerrado", ano=2024, area_queimada_ha=800.0)],
            2,
        ),
        (
            "sync_pasture_risk_dataset",
            [SimpleNamespace(estado="MG", uf="MG", bioma="Cerrado", ano=2024, area_pastagem_risco_ha=50.0)],
            [],
            1,
        ),
        (
            "sync_cross_risk_dataset",
            [SimpleNamespace(estado="MG", uf="MG", bioma="Cerrado", ano=2024, area_queimada_ha=10.0, area_pastagem_risco_ha=5.0, perc_pastagem_queimada=2.0, nivel_risco_historico="medio")],
            [],
            1,
        ),
        (
            "sync_fire_points_dataset",
            [SimpleNamespace(data_hora="2024-07-01T10:00:00", satelite="AQUA", estado="GO", municipio="Goiania", bioma="Cerrado", risco_fogo=0.7, frp=11.0, latitude=-16.6, longitude=-49.2, ano_mes="2024-07")],
            [],
            1,
        ),
    ],
)
def test_sync_pg_insert_based_datasets(monkeypatch, sync_name, monthly_records, annual_records, expected_count):
    fake_db = FakeDb()
    monkeypatch.setattr(region_service, "pg_insert", InsertFactory())
    monkeypatch.setattr(region_service, "load_climate_records", lambda: monthly_records if sync_name == "sync_climate_dataset" else [])
    monkeypatch.setattr(region_service, "load_burn_scar_monthly_records", lambda: monthly_records if sync_name == "sync_burn_scar_dataset" else [])
    monkeypatch.setattr(region_service, "load_burn_scar_annual_records", lambda: annual_records if sync_name == "sync_burn_scar_dataset" else [])
    monkeypatch.setattr(region_service, "load_pasture_risk_records", lambda: monthly_records if sync_name == "sync_pasture_risk_dataset" else [])
    monkeypatch.setattr(region_service, "load_cross_risk_records", lambda: monthly_records if sync_name == "sync_cross_risk_dataset" else [])
    monkeypatch.setattr(region_service, "load_fire_point_records", lambda: monthly_records if sync_name == "sync_fire_points_dataset" else [])

    getattr(region_service, sync_name)(fake_db)

    assert fake_db.commit_calls == 1
    assert len(fake_db.executed) == expected_count
    assert all(isinstance(statement, FakeInsertStatement) for statement in fake_db.executed)


def test_sync_state_risk_dataset_inserts_latest_period(test_db_session, monkeypatch):
    region, _ = _create_region_with_event(test_db_session, state="MG", municipality="Lavras", ano_mes="2024-08")
    test_db_session.add(
        FireEvent(
            region_id=region.id,
            ano=2024,
            mes=9,
            ano_mes="2024-09",
            quantidade_focos=18,
            risco_fogo_mediano=0.6,
            frp_mediano=22.0,
        )
    )
    test_db_session.commit()

    fake_db = test_db_session
    fake_insert = InsertFactory()
    monkeypatch.setattr(region_service, "pg_insert", fake_insert)
    monkeypatch.setattr(region_service, "load_state_risk_records", lambda: [SimpleNamespace(estado="MG", risco_geral="alto")])

    proxy = SessionProxy(fake_db)

    region_service.sync_state_risk_dataset(proxy)

    assert len(proxy.executed) == 1
    assert proxy.executed[0].payload["region_id"] == region.id
    assert proxy.executed[0].payload["ano_mes"] == "2024-09"
