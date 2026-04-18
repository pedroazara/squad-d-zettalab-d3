"""
Calculo hibrido de score de risco.

Combina score de focos, cicatriz, pastagem e risco historico.
"""

from dataclasses import dataclass

from services.ingestion.file_loaders import (
    load_burn_scar_annual_records,
    load_burn_scar_monthly_records,
    load_cross_risk_records,
    load_pasture_risk_records,
)
from services.ingestion.normalizers import normalize_key
from services.risk_service import AggregateRiskInput, calculate_aggregate_risk_score


@dataclass(frozen=True)
class HybridSupportIndex:
    scar_monthly: dict[tuple[str, int, int], float]
    scar_annual: dict[tuple[str, int], float]
    pasture_annual: dict[tuple[str, int], float]
    crossed_annual: dict[tuple[str, int], tuple[float, str]]
    max_scar_monthly: float
    max_scar_annual: float
    max_pasture: float
    max_crossed_perc: float


def score_for_state_risk(risco_geral: str) -> tuple[float, str]:
    """
    Mapeia classificacao textual de risco para score numerico.

    Args:
        risco_geral: Classificacao textual (alto/medio/baixo)

    Returns:
        Tupla (score: 0-100, risco: baixo/medio/alto)
    """
    normalized = normalize_key(risco_geral)
    if normalized == "ALTO":
        return 82.0, "alto"
    if normalized == "MEDIO":
        return 58.0, "medio"
    return 28.0, "baixo"


def normalize_component(value: float, max_value: float) -> float:
    """
    Normaliza componente para escala 0-1.

    Args:
        value: Valor a normalizar
        max_value: Valor maximo da escala

    Returns:
        Valor normalizado entre 0 e 1
    """
    if max_value <= 0:
        return 0.0
    return max(0.0, min(1.0, value / max_value))


def historical_level_to_component(level: str) -> float:
    """
    Converte nivel de risco historico para componente 0-1.

    Args:
        level: Nivel textual (alto/medio/baixo)

    Returns:
        Score entre 0 e 1
    """
    normalized = normalize_key(level)
    if normalized == "ALTO":
        return 0.9
    if normalized == "MEDIO":
        return 0.6
    if normalized == "BAIXO":
        return 0.3
    return 0.4


def state_fallback_component(
    state_risk_lookup: dict[str, tuple[float, str]],
    estado: str,
) -> float:
    """
    Retorna componente de fallback baseado em risco estadual.

    Args:
        state_risk_lookup: Lookup de risco por estado
        estado: Nome do estado

    Returns:
        Score entre 0 e 1
    """
    entry = state_risk_lookup.get(normalize_key(estado))
    if entry is None:
        return 0.4
    score, _ = entry
    return max(0.0, min(1.0, score / 100.0))


def load_hybrid_support_index() -> HybridSupportIndex:
    """
    Carrega e indexa dados de apoio para score hibrido.

    Consolida cicatrizes mensais/anuais, risco de pastagem e risco cruzado
    com normalizacao para uso em calculos de score.

    Returns:
        HybridSupportIndex com dicionarios indexados e maximos normalizados
    """
    scar_monthly: dict[tuple[str, int, int], float] = {}
    scar_annual: dict[tuple[str, int], float] = {}
    pasture_annual: dict[tuple[str, int], float] = {}
    crossed_annual: dict[tuple[str, int], tuple[float, str]] = {}

    max_scar_monthly = 1.0
    max_scar_annual = 1.0
    max_pasture = 1.0
    max_crossed_perc = 1.0

    for item in load_burn_scar_monthly_records():
        key = (normalize_key(item.estado), item.ano, item.mes)
        scar_monthly[key] = max(scar_monthly.get(key, 0.0), item.area_queimada_ha)
        max_scar_monthly = max(max_scar_monthly, item.area_queimada_ha)

    for item in load_burn_scar_annual_records():
        key = (normalize_key(item.estado), item.ano)
        scar_annual[key] = max(scar_annual.get(key, 0.0), item.area_queimada_ha)
        max_scar_annual = max(max_scar_annual, item.area_queimada_ha)

    for item in load_pasture_risk_records():
        key = (normalize_key(item.estado), item.ano)
        pasture_annual[key] = max(pasture_annual.get(key, 0.0), item.area_pastagem_risco_ha)
        max_pasture = max(max_pasture, item.area_pastagem_risco_ha)

    for item in load_cross_risk_records():
        key = (normalize_key(item.estado), item.ano)
        current = crossed_annual.get(key)
        if current is None or item.perc_pastagem_queimada > current[0]:
            crossed_annual[key] = (item.perc_pastagem_queimada, item.nivel_risco_historico)
        max_crossed_perc = max(max_crossed_perc, item.perc_pastagem_queimada)

    return HybridSupportIndex(
        scar_monthly=scar_monthly,
        scar_annual=scar_annual,
        pasture_annual=pasture_annual,
        crossed_annual=crossed_annual,
        max_scar_monthly=max_scar_monthly,
        max_scar_annual=max_scar_annual,
        max_pasture=max_pasture,
        max_crossed_perc=max_crossed_perc,
    )


def hybrid_components(
    foco_record_input: AggregateRiskInput,
    estado: str,
    ano: int,
    mes: int,
    support_index: HybridSupportIndex,
    state_risk_lookup: dict[str, tuple[float, str]],
) -> tuple[float, float, float, float]:
    """
    Calcula componentes individuais do score hibrido.

    Args:
        foco_record_input: Entrada com dados de focos
        estado: Estado da regiao
        ano: Ano
        mes: Mes
        support_index: Indice de dados de apoio
        state_risk_lookup: Lookup de risco por estado

    Returns:
        Tupla (score_focos, scar, pastura, historico) normalizados 0-1
    """
    score_focos = calculate_aggregate_risk_score(foco_record_input) / 100.0

    state_key = normalize_key(estado)
    scar_monthly_value = support_index.scar_monthly.get((state_key, ano, mes), 0.0)
    scar_annual_value = support_index.scar_annual.get((state_key, ano), 0.0)
    scar_component = normalize_component(scar_monthly_value, support_index.max_scar_monthly)
    if scar_component == 0.0:
        scar_component = normalize_component(scar_annual_value, support_index.max_scar_annual)

    pasture_value = support_index.pasture_annual.get((state_key, ano), 0.0)
    pasture_component = normalize_component(pasture_value, support_index.max_pasture)

    historical_entry = support_index.crossed_annual.get((state_key, ano))
    if historical_entry is not None:
        crossed_perc, level = historical_entry
        perc_component = normalize_component(crossed_perc, support_index.max_crossed_perc)
        level_component = historical_level_to_component(level)
        historical_component = (0.65 * perc_component) + (0.35 * level_component)
    else:
        historical_component = state_fallback_component(state_risk_lookup, estado)

    return score_focos, scar_component, pasture_component, historical_component


def hybrid_score(
    foco_record_input: AggregateRiskInput,
    estado: str,
    ano: int,
    mes: int,
    support_index: HybridSupportIndex,
    state_risk_lookup: dict[str, tuple[float, str]],
) -> float:
    """
    Calcula score hibrido final (0-100).

    Peso: 55% focos + 20% cicatriz + 15% pastagem + 10% historico

    Args:
        foco_record_input: Entrada com dados de focos
        estado: Estado da regiao
        ano: Ano
        mes: Mes
        support_index: Indice de dados de apoio
        state_risk_lookup: Lookup de risco por estado

    Returns:
        Score final entre 0 e 100
    """
    score_focos, scar_component, pasture_component, historical_component = hybrid_components(
        foco_record_input,
        estado,
        ano,
        mes,
        support_index,
        state_risk_lookup,
    )

    score = 100.0 * (
        (0.55 * score_focos)
        + (0.20 * scar_component)
        + (0.15 * pasture_component)
        + (0.10 * historical_component)
    )
    return round(max(0.0, min(100.0, score)), 2)
