"""
Carregamento e parsing de arquivos CSV.

Modulo dedicado a I/O e conversao de tipos com cache para reutilizacao.
"""

import csv
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from .normalizers import fix_text, normalize_key


PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_FILE = PROJECT_ROOT / "data" / "processed" / "focos" / "focos_por_municipio_mes.csv"
CLIMATE_FILE = PROJECT_ROOT / "data" / "processed" / "clima" / "inmet_mensal_resumo.csv"
STATE_RISK_FILE = PROJECT_ROOT / "data" / "processed" / "risco" / "resumo_risco_estados.csv"
SCAR_MONTHLY_FILE = PROJECT_ROOT / "data" / "processed" / "cicatriz" / "cicatriz_fogo_mensal.csv"
SCAR_ANNUAL_FILE = PROJECT_ROOT / "data" / "processed" / "cicatriz" / "cicatriz_fogo_anual.csv"
PASTURE_RISK_FILE = PROJECT_ROOT / "data" / "processed" / "pastagem" / "pastagem_risco.csv"
RISK_CROSSED_FILE = PROJECT_ROOT / "data" / "processed" / "risco" / "dados_risco_cruzado.csv"
FIRE_POINTS_FILE = PROJECT_ROOT / "data" / "interim" / "focos" / "focos_limpos_detalhados.csv"


@dataclass(frozen=True)
class FocoRecord:
    estado: str
    municipio: str
    ano: int
    mes: int
    ano_mes: str
    quantidade_focos: int
    risco_fogo_mediano: float
    frp_mediano: float
    bioma: str


@dataclass(frozen=True)
class ClimateRecord:
    ano: int
    mes: int
    estacao_codigo: str
    temp_max_c: float | None
    temp_min_c: float | None
    umidade_min_pct: float | None
    precipitacao_mm: float | None


@dataclass(frozen=True)
class StateRiskRecord:
    estado: str
    risco_geral: str


@dataclass(frozen=True)
class BurnScarMonthlyRecord:
    bioma: str
    estado: str
    ano: int
    mes: int
    area_queimada_ha: float


@dataclass(frozen=True)
class BurnScarAnnualRecord:
    bioma: str
    estado: str
    ano: int
    area_queimada_ha: float


@dataclass(frozen=True)
class PastureRiskRecord:
    bioma: str
    estado: str
    uf: str | None
    ano: int
    area_pastagem_risco_ha: float


@dataclass(frozen=True)
class CrossRiskRecord:
    bioma: str
    estado: str
    uf: str | None
    ano: int
    area_queimada_ha: float
    area_pastagem_risco_ha: float
    perc_pastagem_queimada: float
    nivel_risco_historico: str


@dataclass(frozen=True)
class FirePointRecord:
    data_hora: str
    satelite: str
    estado: str
    municipio: str
    bioma: str
    risco_fogo: float
    frp: float
    latitude: float
    longitude: float
    ano_mes: str


def parse_int(value: str) -> int:
    """Converte string para int com tratamento de decimais."""
    return int(float(value))


def parse_float(value: str) -> float:
    """Converte string para float com tratamento de valores vazios."""
    normalized_value = value.strip()
    if not normalized_value:
        return 0.0
    return float(normalized_value)


def parse_nullable_float(value: str) -> float | None:
    """Converte string para float ou None se vazio."""
    normalized_value = value.strip()
    if not normalized_value:
        return None
    return float(normalized_value)


@lru_cache(maxsize=1)
def load_fire_point_records() -> tuple[FirePointRecord, ...]:
    """Carrega pontos de fogo georreferenciados com cache."""
    if not FIRE_POINTS_FILE.exists():
        return tuple()

    records: list[FirePointRecord] = []
    with FIRE_POINTS_FILE.open("r", encoding="utf-8-sig", newline="") as data_file:
        reader = csv.DictReader(data_file)
        for row in reader:
            latitude = row.get("Latitude", "").strip()
            longitude = row.get("Longitude", "").strip()
            if not latitude or not longitude:
                continue

            records.append(
                FirePointRecord(
                    data_hora=row.get("DataHora", "").strip(),
                    satelite=row.get("Satelite", "").strip(),
                    estado=fix_text(row.get("Estado_Clean", row.get("Estado", ""))),
                    municipio=fix_text(row.get("Municipio_Clean", row.get("Municipio", ""))),
                    bioma=fix_text(row.get("Bioma", "")),
                    risco_fogo=parse_float(row.get("RiscoFogo", "0")),
                    frp=parse_float(row.get("FRP", "0")),
                    latitude=float(latitude),
                    longitude=float(longitude),
                    ano_mes=row.get("AnoMes", "").strip(),
                )
            )

    return tuple(records)


@lru_cache(maxsize=1)
def load_records() -> tuple[FocoRecord, ...]:
    """Carrega registros de focos por municipio/mes com cache."""
    if not DATA_FILE.exists():
        raise FileNotFoundError(f"Arquivo de dados nao encontrado: {DATA_FILE}")

    records: list[FocoRecord] = []

    with DATA_FILE.open("r", encoding="utf-8-sig", newline="") as data_file:
        reader = csv.DictReader(data_file)
        for row in reader:
            records.append(
                FocoRecord(
                    municipio=row["Municipio_Clean"].strip(),
                    estado=row["Estado_Clean"].strip(),
                    ano=parse_int(row["Ano"]),
                    mes=parse_int(row["Mes"]),
                    ano_mes=row["AnoMes"].strip(),
                    quantidade_focos=parse_int(row["Quantidade_Focos"]),
                    risco_fogo_mediano=parse_float(row["RiscoFogo_Mediano"]),
                    frp_mediano=parse_float(row["FRP_Mediano"]),
                    bioma=row["Bioma_Predominante"].strip(),
                )
            )

    return tuple(records)


@lru_cache(maxsize=1)
def load_climate_records() -> tuple[ClimateRecord, ...]:
    """Carrega dados climaticos mensais com cache."""
    if not CLIMATE_FILE.exists():
        return tuple()

    records: list[ClimateRecord] = []
    with CLIMATE_FILE.open("r", encoding="utf-8-sig", newline="") as data_file:
        reader = csv.DictReader(data_file)
        for row in reader:
            records.append(
                ClimateRecord(
                    ano=parse_int(row["ano"]),
                    mes=parse_int(row["mes"]),
                    estacao_codigo=row["estacao_codigo"].strip(),
                    temp_max_c=parse_nullable_float(row.get("temp_max_c", "")),
                    temp_min_c=parse_nullable_float(row.get("temp_min_c", "")),
                    umidade_min_pct=parse_nullable_float(row.get("umidade_min_pct", "")),
                    precipitacao_mm=parse_nullable_float(row.get("precipitacao_mm", "")),
                )
            )

    return tuple(records)


@lru_cache(maxsize=1)
def load_state_risk_records() -> tuple[StateRiskRecord, ...]:
    """Carrega risco geral por estado com cache."""
    if not STATE_RISK_FILE.exists():
        return tuple()

    records: list[StateRiskRecord] = []
    with STATE_RISK_FILE.open("r", encoding="utf-8-sig", newline="") as data_file:
        reader = csv.DictReader(data_file)
        for row in reader:
            records.append(
                StateRiskRecord(
                    estado=row["estado"].strip(),
                    risco_geral=row["risco_geral"].strip(),
                )
            )

    return tuple(records)


@lru_cache(maxsize=1)
def load_burn_scar_monthly_records() -> tuple[BurnScarMonthlyRecord, ...]:
    """Carrega cicatrizes mensais de fogo com cache."""
    if not SCAR_MONTHLY_FILE.exists():
        return tuple()

    records: list[BurnScarMonthlyRecord] = []
    with SCAR_MONTHLY_FILE.open("r", encoding="utf-8-sig", newline="") as data_file:
        reader = csv.DictReader(data_file)
        for row in reader:
            records.append(
                BurnScarMonthlyRecord(
                    bioma=fix_text(row.get("bioma", "")),
                    estado=fix_text(row.get("estado", "")),
                    ano=parse_int(row.get("ano", "0")),
                    mes=parse_int(row.get("mes_numero", "0")),
                    area_queimada_ha=parse_float(row.get("area_queimada_ha", "0")),
                )
            )

    return tuple(records)


@lru_cache(maxsize=1)
def load_burn_scar_annual_records() -> tuple[BurnScarAnnualRecord, ...]:
    """Carrega cicatrizes anuais de fogo com cache."""
    if not SCAR_ANNUAL_FILE.exists():
        return tuple()

    records: list[BurnScarAnnualRecord] = []
    with SCAR_ANNUAL_FILE.open("r", encoding="utf-8-sig", newline="") as data_file:
        reader = csv.DictReader(data_file)
        for row in reader:
            records.append(
                BurnScarAnnualRecord(
                    bioma=fix_text(row.get("bioma", "")),
                    estado=fix_text(row.get("estado", "")),
                    ano=parse_int(row.get("ano", "0")),
                    area_queimada_ha=parse_float(row.get("area_queimada_ha", "0")),
                )
            )

    return tuple(records)


@lru_cache(maxsize=1)
def load_pasture_risk_records() -> tuple[PastureRiskRecord, ...]:
    """Carrega risco de pastagem com cache."""
    if not PASTURE_RISK_FILE.exists():
        return tuple()

    records: list[PastureRiskRecord] = []
    with PASTURE_RISK_FILE.open("r", encoding="utf-8-sig", newline="") as data_file:
        reader = csv.DictReader(data_file)
        for row in reader:
            records.append(
                PastureRiskRecord(
                    bioma=fix_text(row.get("bioma", "")),
                    estado=fix_text(row.get("estado", "")),
                    uf=fix_text(row.get("uf", "")) or None,
                    ano=parse_int(row.get("ano", "0")),
                    area_pastagem_risco_ha=parse_float(row.get("area_pastagem_risco_ha", "0")),
                )
            )

    return tuple(records)


@lru_cache(maxsize=1)
def load_cross_risk_records() -> tuple[CrossRiskRecord, ...]:
    """Carrega risco cruzado com cache."""
    if not RISK_CROSSED_FILE.exists():
        return tuple()

    records: list[CrossRiskRecord] = []
    with RISK_CROSSED_FILE.open("r", encoding="utf-8-sig", newline="") as data_file:
        reader = csv.DictReader(data_file)
        for row in reader:
            records.append(
                CrossRiskRecord(
                    bioma=fix_text(row.get("bioma", "")),
                    estado=fix_text(row.get("estado", "")),
                    uf=fix_text(row.get("uf", "")) or None,
                    ano=parse_int(row.get("ano", "0")),
                    area_queimada_ha=parse_float(row.get("area_queimada_ha", "0")),
                    area_pastagem_risco_ha=parse_float(row.get("area_pastagem_risco_ha", "0")),
                    perc_pastagem_queimada=parse_float(row.get("perc_pastagem_queimada", "0")),
                    nivel_risco_historico=fix_text(row.get("nivel_risco_historico", "")),
                )
            )

    return tuple(records)
