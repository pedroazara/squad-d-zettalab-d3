from types import SimpleNamespace

import pytest

from services import risk_hybrid_service
from services.risk_service import AggregateRiskInput


def test_score_and_component_helpers():
    assert risk_hybrid_service.score_for_state_risk("alto") == (82.0, "alto")
    assert risk_hybrid_service.score_for_state_risk("medio") == (58.0, "medio")
    assert risk_hybrid_service.score_for_state_risk("baixo") == (28.0, "baixo")
    assert risk_hybrid_service.normalize_component(10.0, 20.0) == pytest.approx(0.5)
    assert risk_hybrid_service.normalize_component(10.0, 0.0) == 0.0
    assert risk_hybrid_service.historical_level_to_component("alto") == pytest.approx(0.9)
    assert risk_hybrid_service.historical_level_to_component("medio") == pytest.approx(0.6)
    assert risk_hybrid_service.historical_level_to_component("baixo") == pytest.approx(0.3)
    assert risk_hybrid_service.state_fallback_component({"MINAS GERAIS": (50.0, "medio")}, "Minas Gerais") == pytest.approx(0.5)
    assert risk_hybrid_service.state_fallback_component({}, "Sem Estado") == pytest.approx(0.4)


def test_load_hybrid_support_index(monkeypatch):
    monkeypatch.setattr(
        risk_hybrid_service,
        "load_burn_scar_monthly_records",
        lambda: [SimpleNamespace(estado="MG", ano=2024, mes=8, area_queimada_ha=120.0)],
    )
    monkeypatch.setattr(
        risk_hybrid_service,
        "load_burn_scar_annual_records",
        lambda: [SimpleNamespace(estado="MG", ano=2024, area_queimada_ha=800.0)],
    )
    monkeypatch.setattr(
        risk_hybrid_service,
        "load_pasture_risk_records",
        lambda: [SimpleNamespace(estado="MG", ano=2024, area_pastagem_risco_ha=50.0)],
    )
    monkeypatch.setattr(
        risk_hybrid_service,
        "load_cross_risk_records",
        lambda: [SimpleNamespace(estado="MG", ano=2024, perc_pastagem_queimada=2.0, nivel_risco_historico="medio")],
    )

    index = risk_hybrid_service.load_hybrid_support_index()

    assert index.max_scar_monthly == pytest.approx(120.0)
    assert index.max_scar_annual == pytest.approx(800.0)
    assert index.max_pasture == pytest.approx(50.0)
    assert index.max_crossed_perc == pytest.approx(2.0)
    assert index.scar_monthly[("MG", 2024, 8)] == pytest.approx(120.0)
    assert index.crossed_annual[("MG", 2024)] == (2.0, "medio")


def test_hybrid_components_and_score(monkeypatch):
    support_index = risk_hybrid_service.HybridSupportIndex(
        scar_monthly={("MINAS GERAIS", 2024, 8): 100.0},
        scar_annual={("MINAS GERAIS", 2024): 200.0},
        pasture_annual={("MINAS GERAIS", 2024): 50.0},
        crossed_annual={("MINAS GERAIS", 2024): (2.0, "alto")},
        max_scar_monthly=200.0,
        max_scar_annual=300.0,
        max_pasture=100.0,
        max_crossed_perc=4.0,
    )
    state_risk_lookup = {"MINAS GERAIS": (58.0, "medio")}
    input_data = AggregateRiskInput(quantidade_focos=10, risco_fogo_mediano=0.4, frp_mediano=20.0)

    components = risk_hybrid_service.hybrid_components(input_data, "Minas Gerais", 2024, 8, support_index, state_risk_lookup)
    score = risk_hybrid_service.hybrid_score(input_data, "Minas Gerais", 2024, 8, support_index, state_risk_lookup)

    assert components[0] > 0
    assert components[1] == pytest.approx(0.5)
    assert components[2] == pytest.approx(0.5)
    assert components[3] > 0.0
    assert 0.0 <= score <= 100.0
