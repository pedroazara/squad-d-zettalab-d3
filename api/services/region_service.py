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
