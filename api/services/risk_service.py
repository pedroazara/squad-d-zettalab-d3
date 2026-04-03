from dataclasses import dataclass


@dataclass(frozen=True)
class AggregateRiskInput:
    quantidade_focos: int
    risco_fogo_mediano: float
    frp_mediano: float


@dataclass(frozen=True)
class RiskInput:
    temperatura: float
    umidade: float
    vento: float
    precipitacao: float
    focos_calor: int


def _clamp(value: float, minimum: float = 0.0, maximum: float = 1.0) -> float:
    return max(minimum, min(value, maximum))


def calculate_risk_score(data: RiskInput) -> float:
    temp_norm = _clamp((data.temperatura - 15.0) / 25.0)
    umidade_norm = _clamp(1.0 - (data.umidade / 100.0))
    vento_norm = _clamp(data.vento / 60.0)
    seca_norm = _clamp(1.0 - (data.precipitacao / 50.0))
    focos_norm = _clamp(data.focos_calor / 50.0)

    score = 100 * (
        (0.35 * temp_norm)
        + (0.25 * umidade_norm)
        + (0.20 * vento_norm)
        + (0.10 * seca_norm)
        + (0.10 * focos_norm)
    )
    return round(score, 2)


def calculate_aggregate_risk_score(data: AggregateRiskInput) -> float:
    focos_norm = _clamp(data.quantidade_focos / 50.0)
    risco_fogo_norm = _clamp(data.risco_fogo_mediano)
    frp_norm = _clamp(data.frp_mediano / 100.0)

    score = 100 * (
        (0.45 * focos_norm)
        + (0.40 * risco_fogo_norm)
        + (0.15 * frp_norm)
    )
    return round(score, 2)


def classify_risk(score: float) -> str:
    if score < 35:
        return "baixo"
    if score < 65:
        return "medio"
    return "alto"


def forecast_tendency(current_score: float, tomorrow_score: float) -> str:
    delta = tomorrow_score - current_score
    if delta > 3:
        return "crescente"
    if delta < -3:
        return "decrescente"
    return "estavel"
