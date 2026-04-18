from services.risk_service import (
    AggregateRiskInput,
    RiskInput,
    _clamp,
    calculate_aggregate_risk_score,
    calculate_risk_score,
    classify_risk,
    forecast_tendency,
)


def test_clamp_bounds():
    assert _clamp(-1.0) == 0.0
    assert _clamp(0.5) == 0.5
    assert _clamp(2.0) == 1.0


def test_calculate_risk_score_low():
    data = RiskInput(
        temperatura=16.0,
        umidade=95.0,
        vento=2.0,
        precipitacao=45.0,
        focos_calor=0,
    )
    score = calculate_risk_score(data)
    assert 0 <= score <= 100
    assert score < 35


def test_calculate_risk_score_high():
    data = RiskInput(
        temperatura=40.0,
        umidade=10.0,
        vento=40.0,
        precipitacao=0.0,
        focos_calor=60,
    )
    score = calculate_risk_score(data)
    assert 0 <= score <= 100
    assert score >= 65


def test_calculate_aggregate_risk_score():
    data = AggregateRiskInput(
        quantidade_focos=25,
        risco_fogo_mediano=0.8,
        frp_mediano=50.0,
    )
    score = calculate_aggregate_risk_score(data)
    assert 0 <= score <= 100


def test_classify_risk_bands():
    assert classify_risk(10) == "baixo"
    assert classify_risk(40) == "medio"
    assert classify_risk(90) == "alto"


def test_forecast_tendency():
    assert forecast_tendency(50, 55) == "crescente"
    assert forecast_tendency(50, 45) == "decrescente"
    assert forecast_tendency(50, 52) == "estavel"
