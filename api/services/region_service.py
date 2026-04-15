import csv
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from services.risk_service import (
    AggregateRiskInput,
    calculate_aggregate_risk_score,
    classify_risk,
    forecast_tendency,
)


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_FILE = PROJECT_ROOT / "data" / "processed" / "focos" / "focos_por_municipio_mes.csv"


@dataclass(frozen=True)
class RiskRegionRecord:
    id: int
    municipio: str
    estado: str
    ano: int
    mes: int
    ano_mes: str
    quantidade_focos: int
    risco_fogo_mediano: float
    frp_mediano: float
    bioma: str

    @property
    def nome(self) -> str:
        return f"{self.municipio} - {self.estado} ({self.ano_mes})"


_STATE_COORDINATES: dict[str, tuple[float, float]] = {
    "ACRE": (-9.02, -70.81),
    "ALAGOAS": (-9.57, -36.78),
    "AMAPA": (1.41, -51.77),
    "AMAZONAS": (-3.07, -61.66),
    "BAHIA": (-12.70, -41.70),
    "CEARA": (-5.20, -39.50),
    "DISTRITO FEDERAL": (-15.78, -47.93),
    "ESPIRITO SANTO": (-19.19, -40.34),
    "GOIAS": (-15.90, -50.14),
    "MARANHAO": (-5.42, -45.44),
    "MATO GROSSO": (-12.64, -55.42),
    "MATO GROSSO DO SUL": (-20.51, -54.54),
    "MINAS GERAIS": (-18.10, -44.38),
    "PARA": (-3.79, -52.48),
    "PARAIBA": (-7.24, -36.78),
    "PARANA": (-24.89, -51.55),
    "PERNAMBUCO": (-8.38, -37.86),
    "PIAUI": (-7.72, -42.73),
    "RIO DE JANEIRO": (-22.84, -43.15),
    "RIO GRANDE DO NORTE": (-5.22, -36.52),
    "RIO GRANDE DO SUL": (-30.17, -53.50),
    "RONDONIA": (-11.22, -62.80),
    "RORAIMA": (1.89, -61.22),
    "SANTA CATARINA": (-27.33, -50.88),
    "SAO PAULO": (-22.19, -48.79),
    "SERGIPE": (-10.57, -37.45),
    "TOCANTINS": (-10.30, -48.30),
}


def _normalize(value: str) -> str:
    return (
        value.strip()
        .upper()
        .replace("Á", "A")
        .replace("À", "A")
        .replace("Â", "A")
        .replace("Ã", "A")
        .replace("É", "E")
        .replace("Ê", "E")
        .replace("Í", "I")
        .replace("Ó", "O")
        .replace("Ô", "O")
        .replace("Õ", "O")
        .replace("Ú", "U")
        .replace("Ç", "C")
    )


def _state_coordinates(state_name: str) -> tuple[float, float]:
    fallback = (-15.0, -55.0)
    return _STATE_COORDINATES.get(_normalize(state_name), fallback)


def _build_region_snapshot(region: RiskRegionRecord) -> dict[str, float | int | str]:
    base_lat, base_lng = _state_coordinates(region.estado)
    offset = (region.id % 9) * 0.03
    temperatura = round(24 + (region.risco_fogo_mediano * 12) + (region.frp_mediano / 180), 1)
    umidade = round(max(12.0, 75 - (region.risco_fogo_mediano * 50)), 1)
    vento = round(6 + min(24.0, region.frp_mediano / 12), 1)
    precipitacao = round(max(0.0, 120 - (region.risco_fogo_mediano * 110)), 1)

    return {
        "id": region.id,
        "nome": region.nome,
        "latitude": round(base_lat + offset, 4),
        "longitude": round(base_lng - offset, 4),
        "temperatura": temperatura,
        "umidade": umidade,
        "vento": vento,
        "precipitacao": precipitacao,
        "focos_calor": region.quantidade_focos,
    }


def _parse_int(value: str) -> int:
    return int(float(value))


def _parse_float(value: str) -> float:
    normalized_value = value.strip()
    if not normalized_value:
        return 0.0

    return float(normalized_value)


@lru_cache(maxsize=1)
def _load_records() -> tuple[RiskRegionRecord, ...]:
    if not DATA_FILE.exists():
        raise FileNotFoundError(f"Arquivo de dados nao encontrado: {DATA_FILE}")

    records: list[RiskRegionRecord] = []

    with DATA_FILE.open("r", encoding="utf-8-sig", newline="") as data_file:
        reader = csv.DictReader(data_file)
        for index, row in enumerate(reader, start=1):
            records.append(
                RiskRegionRecord(
                    id=index,
                    municipio=row["Municipio_Clean"].strip(),
                    estado=row["Estado_Clean"].strip(),
                    ano=_parse_int(row["Ano"]),
                    mes=_parse_int(row["Mes"]),
                    ano_mes=row["AnoMes"].strip(),
                    quantidade_focos=_parse_int(row["Quantidade_Focos"]),
                    risco_fogo_mediano=_parse_float(row["RiscoFogo_Mediano"]),
                    frp_mediano=_parse_float(row["FRP_Mediano"]),
                    bioma=row["Bioma_Predominante"].strip(),
                )
            )

    return tuple(records)


def list_regions() -> list[RiskRegionRecord]:
    return list(_load_records())


def list_region_snapshots() -> list[dict[str, float | int | str]]:
    return [_build_region_snapshot(region) for region in _load_records()]


def get_region(region_id: int) -> RiskRegionRecord | None:
    for region in _load_records():
        if region.id == region_id:
            return region
    return None


def build_risk_payload(region: RiskRegionRecord) -> dict[str, object]:
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
        "regiao_id": region.id,
        "regiao_nome": region.nome,
        "score": current_score,
        "risco": classify_risk(current_score),
        "score_amanha": tomorrow_score,
        "risco_amanha": classify_risk(tomorrow_score),
        "tendencia": forecast_tendency(current_score, tomorrow_score),
    }
