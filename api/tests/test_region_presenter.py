from types import SimpleNamespace

import pytest

from services.region_presenter import (
    RegionContext,
    build_climate_item,
    build_fire_item,
    build_fire_point_item,
    build_region_snapshot,
    build_region_snapshot_with_climate,
    build_risk_payload,
    build_risk_payload_from_snapshot,
)


def test_build_region_snapshot():
    region = RegionContext(
        region_id=7,
        estado="MG",
        municipio="Lavras",
        ano=2024,
        mes=8,
        ano_mes="2024-08",
        quantidade_focos=12,
        risco_fogo_mediano=0.45,
        frp_mediano=22.0,
        bioma="Cerrado",
    )

    snapshot = build_region_snapshot(region, -21.0, -44.0)

    assert snapshot["id"] == 7
    assert snapshot["nome"] == "Lavras - MG (2024-08)"
    assert snapshot["latitude"] == pytest.approx(-20.79)
    assert snapshot["longitude"] == pytest.approx(-44.21)
    assert snapshot["focos_calor"] == 12


def test_build_region_snapshot_with_climate():
    region = RegionContext(
        region_id=3,
        estado="SP",
        municipio="Campinas",
        ano=2024,
        mes=2,
        ano_mes="2024-02",
        quantidade_focos=5,
        risco_fogo_mediano=0.2,
        frp_mediano=10.0,
        bioma=None,
    )

    snapshot = build_region_snapshot_with_climate(region, -22.0, -47.0, 31.5, 40.0, 6.0)

    assert snapshot["temperatura"] == pytest.approx(31.9)
    assert snapshot["umidade"] == pytest.approx(39.2)
    assert snapshot["precipitacao"] == pytest.approx(4.8)


def test_build_risk_payload():
    region = RegionContext(
        region_id=9,
        estado="BA",
        municipio="Jequie",
        ano=2024,
        mes=9,
        ano_mes="2024-09",
        quantidade_focos=20,
        risco_fogo_mediano=0.6,
        frp_mediano=35.0,
        bioma="Caatinga",
    )

    payload = build_risk_payload(region, 64.0, "medio", 71.5, "alto", "crescente")

    assert payload == {
        "regiao_id": 9,
        "regiao_nome": "Jequie - BA (2024-09)",
        "score": 64.0,
        "risco": "medio",
        "score_amanha": 71.5,
        "risco_amanha": "alto",
        "tendencia": "crescente",
    }


def test_build_risk_payload_from_snapshot():
    region = SimpleNamespace(id=11, municipio="Uberaba", estado="MG")
    snapshot = SimpleNamespace(
        ano_mes="2024-10",
        score=72.0,
        risco="alto",
        score_amanha=68.0,
        risco_amanha="medio",
        tendencia="decrescente",
    )

    payload = build_risk_payload_from_snapshot(region, snapshot)

    assert payload["regiao_nome"] == "Uberaba - MG (2024-10)"
    assert payload["score"] == 72.0
    assert payload["tendencia"] == "decrescente"


def test_build_fire_item_and_point_and_climate_item():
    region = SimpleNamespace(estado="GO", municipio="Rio Verde")
    fire_event = SimpleNamespace(
        id=21,
        ano_mes="2024-11",
        quantidade_focos=14,
        risco_fogo_mediano=0.55,
        frp_mediano=19.5,
    )
    fire_point = SimpleNamespace(
        id=31,
        data_hora="2024-11-12T10:00:00",
        satelite="AQUA",
        estado="GO",
        municipio="Rio Verde",
        bioma="Cerrado",
        risco_fogo=0.7,
        frp=12.4,
        latitude=-17.8,
        longitude=-50.9,
        ano_mes="2024-11",
    )
    climate = SimpleNamespace(
        estacao_codigo="A123",
        ano=2024,
        mes=11,
        temp_max_c=35.0,
        temp_min_c=21.0,
        umidade_min_pct=18.0,
        precipitacao_mm=2.0,
    )

    fire_item = build_fire_item(region, fire_event, 57.3, "medio")
    point_item = build_fire_point_item(fire_point)
    climate_item = build_climate_item(climate, 28.0)

    assert fire_item["id"] == 21
    assert fire_item["estado"] == "GO"
    assert fire_item["score"] == 57.3
    assert point_item["latitude"] == -17.8
    assert point_item["satelite"] == "AQUA"
    assert climate_item["temp_media_c"] == 28.0
    assert climate_item["estacao_codigo"] == "A123"
