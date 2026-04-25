"""
Carregamento e parsing de arquivos CSV.

Modulo dedicado a I/O e conversao de tipos com cache para reutilizacao.
"""

import csv
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from .normalizers import canonical_state_name, fix_text, normalize_key


PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_FILE = PROJECT_ROOT / "data" / "processed" / "focos" / "focos_consolidado.csv"
CLIMATE_FILE = PROJECT_ROOT / "data" / "processed" / "clima" / "inmet_diario_consolidado.csv"
CLIMATE_DAILY_FILE = PROJECT_ROOT / "data" / "processed" / "clima" / "inmet_diario_consolidado.csv"
STATE_RISK_FILE = PROJECT_ROOT / "data" / "processed" / "risco" / "resumo_risco_estados.csv"
SCAR_MONTHLY_FILE = PROJECT_ROOT / "data" / "processed" / "cicatriz" / "cicatriz_fogo_mensal.csv"
SCAR_ANNUAL_FILE = PROJECT_ROOT / "data" / "processed" / "cicatriz" / "cicatriz_fogo_anual.csv"
PASTURE_RISK_FILE = PROJECT_ROOT / "data" / "processed" / "pastagem" / "pastagem_risco.csv"
RISK_CROSSED_FILE = PROJECT_ROOT / "data" / "processed" / "risco" / "dados_risco_cruzado.csv"
FIRE_POINTS_FILE = PROJECT_ROOT / "data" / "processed" / "focos" / "focos_consolidado.csv"
FIRE_POINTS_FALLBACK_FILE = PROJECT_ROOT / "data" / "processed" / "focos" / "focos_consolidado.csv"
FAUNA_FILE = PROJECT_ROOT / "data" / "fauna_cerrado" / "fauna_cerrado_2019.csv"


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
    estacao_nome: str
    temp_max_c: float | None
    temp_min_c: float | None
    umidade_min_pct: float | None
    precipitacao_mm: float | None


@dataclass(frozen=True)
class ClimateDailyRecord:
    data: str
    estacao_codigo: str
    estacao_nome: str
    latitude: float
    longitude: float
    altitude_m: float
    temp_max_c: float | None
    temp_min_c: float | None
    temp_inst_c: float | None
    umidade_min_pct: float | None
    umidade_max_pct: float | None
    umidade_inst_pct: float | None
    precipitacao_mm: float | None
    vento_rajada_ms: float | None
    vento_vel_ms: float | None
    risco_meteorologico: str


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


@dataclass(frozen=True)
class FaunaRecord:
    nome_cientifico: str
    nome_popular: str
    grupo: str
    status_iucn: str
    bioma: str
    bioma_principal: str
    habitat_afetado_pct: float
    latitude: float
    longitude: float
    estado: str
    ano: int
    mes: int
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
    data_path = FIRE_POINTS_FILE if FIRE_POINTS_FILE.exists() else FIRE_POINTS_FALLBACK_FILE
    if not data_path.exists():
        return tuple()

    records: list[FirePointRecord] = []
    
    with data_path.open("r", encoding="utf-8-sig", newline="") as data_file:
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
                    estado=canonical_state_name(row.get("Estado", "")),
                    municipio=fix_text(row.get("Municipio", "")),
                    bioma=fix_text(row.get("Bioma", "")),
                    risco_fogo=parse_float(row.get("RiscoFogo", "0")),
                    frp=parse_float(row.get("FRP", "0")),
                    latitude=float(latitude),
                    longitude=float(longitude),
                    ano_mes=row.get("AnoMes", "").strip(),
                )
            )

    print(f"Loaded {len(records)} fire point records from full dataset")
    return tuple(records)


@lru_cache(maxsize=1)
def load_climate_daily_records() -> tuple[ClimateDailyRecord, ...]:
    """Carrega dados climáticos diários com cache."""
    if not CLIMATE_DAILY_FILE.exists():
        return tuple()

    records: list[ClimateDailyRecord] = []
    with CLIMATE_DAILY_FILE.open("r", encoding="utf-8-sig", newline="") as data_file:
        reader = csv.DictReader(data_file)
        for row in reader:
            try:
                records.append(
                    ClimateDailyRecord(
                        data=row.get("data", "").strip(),
                        estacao_codigo=row.get("estacao_codigo", "").strip(),
                        estacao_nome=row.get("estacao_nome", "").strip(),
                        latitude=parse_float(row.get("latitude", "0")),
                        longitude=parse_float(row.get("longitude", "0")),
                        altitude_m=parse_float(row.get("altitude_m", "0")),
                        temp_max_c=parse_nullable_float(row.get("temp_max_c")),
                        temp_min_c=parse_nullable_float(row.get("temp_min_c")),
                        temp_inst_c=parse_nullable_float(row.get("temp_inst_c")),
                        umidade_min_pct=parse_nullable_float(row.get("umidade_min_pct")),
                        umidade_max_pct=parse_nullable_float(row.get("umidade_max_pct")),
                        umidade_inst_pct=parse_nullable_float(row.get("umidade_inst_pct")),
                        precipitacao_mm=parse_nullable_float(row.get("precipitacao_mm")),
                        vento_rajada_ms=parse_nullable_float(row.get("vento_rajada_ms")),
                        vento_vel_ms=parse_nullable_float(row.get("vento_vel_ms")),
                        risco_meteorologico=row.get("risco_meteorologico", "").strip(),
                    )
                )
            except (ValueError, KeyError) as e:
                # Skip rows with invalid data
                continue

    return tuple(records)


def parse_nullable_float(value: str) -> float | None:
    """Converte string para float com tratamento de valores vazios."""
    normalized_value = value.strip()
    if not normalized_value:
        return None
    try:
        return float(normalized_value)
    except ValueError:
        return None


@lru_cache(maxsize=1)
def load_records() -> tuple[FocoRecord, ...]:
    """Carrega registros de focos por municipio/mes com cache, agregando dados individuais do focos_consolidado.csv."""
    if not DATA_FILE.exists():
        raise FileNotFoundError(f"Arquivo de dados nao encontrado: {DATA_FILE}")

    # Aggregate individual fire point records into monthly summaries by municipality
    from collections import defaultdict
    
    aggregation_data: dict[tuple[str, str, str], list[dict]] = defaultdict(list)
    
    with DATA_FILE.open("r", encoding="utf-8-sig", newline="") as data_file:
        reader = csv.DictReader(data_file)
        for row in reader:
            key = (row["Estado"].strip(), row["Municipio"].strip(), row["AnoMes"].strip())
            aggregation_data[key].append({
                "risco_fogo": parse_float(row["RiscoFogo"]),
                "frp": parse_float(row["FRP"]),
                "bioma": row["Bioma"].strip(),
            })
    
    records: list[FocoRecord] = []
    
    for (estado, municipio, ano_mes), fire_points in aggregation_data.items():
        # Calculate aggregates
        quantidade_focos = len(fire_points)
        
        # Calculate median values
        riscos_fogo = sorted([fp["risco_fogo"] for fp in fire_points])
        frps = sorted([fp["frp"] for fp in fire_points])
        
        risco_fogo_mediano = riscos_fogo[len(riscos_fogo) // 2] if riscos_fogo else 0.0
        frp_mediano = frps[len(frps) // 2] if frps else 0.0
        
        # Get most common biome
        bioma_counts = defaultdict(int)
        for fp in fire_points:
            bioma_counts[fp["bioma"]] += 1
        bioma_predominante = max(bioma_counts.keys(), key=lambda k: bioma_counts[k]) if bioma_counts else ""
        
        # Extract year and month from ano_mes
        ano = int(ano_mes.split("-")[0])
        mes = int(ano_mes.split("-")[1])
        
        records.append(
            FocoRecord(
                municipio=municipio,
                estado=canonical_state_name(estado),
                ano=ano,
                mes=mes,
                ano_mes=ano_mes,
                quantidade_focos=quantidade_focos,
                risco_fogo_mediano=risco_fogo_mediano,
                frp_mediano=frp_mediano,
                bioma=bioma_predominante,
            )
        )

    return tuple(records)


@lru_cache(maxsize=1)
def load_climate_records() -> tuple[ClimateRecord, ...]:
    """Carrega dados climaticos mensais com cache, agregando dados diarios do inmet_diario_consolidado.csv."""
    if not CLIMATE_FILE.exists():
        return tuple()

    # Aggregate daily records into monthly summaries by station
    from collections import defaultdict
    
    aggregation_data: dict[tuple[str, str, str], list[dict]] = defaultdict(list)
    
    with CLIMATE_FILE.open("r", encoding="utf-8-sig", newline="") as data_file:
        reader = csv.DictReader(data_file)
        for row in reader:
            data_str = row["data"].strip()
            if not data_str:
                continue
            
            # Extract year and month from date
            try:
                year_month = data_str[:7]  # YYYY-MM format
                estacao_codigo = row["estacao_codigo"].strip()
                estacao_nome = row["estacao_nome"].strip()
                
                key = (estacao_codigo, estacao_nome, year_month)
                aggregation_data[key].append({
                    "temp_max_c": parse_nullable_float(row["temp_max_c"]),
                    "temp_min_c": parse_nullable_float(row["temp_min_c"]),
                    "umidade_min_pct": parse_nullable_float(row["umidade_min_pct"]),
                    "precipitacao_mm": parse_nullable_float(row["precipitacao_mm"]),
                })
            except (ValueError, KeyError) as e:
                # Skip rows with invalid data
                continue
    
    records: list[ClimateRecord] = []
    
    for (estacao_codigo, estacao_nome, year_month), daily_records in aggregation_data.items():
        # Calculate monthly aggregates
        temp_max_values = [dr["temp_max_c"] for dr in daily_records if dr["temp_max_c"] is not None]
        temp_min_values = [dr["temp_min_c"] for dr in daily_records if dr["temp_min_c"] is not None]
        umidade_min_values = [dr["umidade_min_pct"] for dr in daily_records if dr["umidade_min_pct"] is not None]
        precipitacao_values = [dr["precipitacao_mm"] for dr in daily_records if dr["precipitacao_mm"] is not None]
        
        # Calculate monthly max/min/sum values
        temp_max_c = max(temp_max_values) if temp_max_values else None
        temp_min_c = min(temp_min_values) if temp_min_values else None
        umidade_min_pct = min(umidade_min_values) if umidade_min_values else None
        precipitacao_mm = sum(precipitacao_values) if precipitacao_values else None
        
        # Extract year and month from year_month
        ano = int(year_month.split("-")[0])
        mes = int(year_month.split("-")[1])
        
        records.append(
            ClimateRecord(
                estacao_codigo=estacao_codigo,
                estacao_nome=estacao_nome,
                ano=ano,
                mes=mes,
                temp_max_c=temp_max_c,
                temp_min_c=temp_min_c,
                umidade_min_pct=umidade_min_pct,
                precipitacao_mm=precipitacao_mm,
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
                    estado=canonical_state_name(row["estado"]),
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
                    estado=canonical_state_name(row.get("estado", "")),
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
                    estado=canonical_state_name(row.get("estado", "")),
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
                    estado=canonical_state_name(row.get("estado", "")),
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
                    estado=canonical_state_name(row.get("estado", "")),
                    uf=fix_text(row.get("uf", "")) or None,
                    ano=parse_int(row.get("ano", "0")),
                    area_queimada_ha=parse_float(row.get("area_queimada_ha", "0")),
                    area_pastagem_risco_ha=parse_float(row.get("area_pastagem_risco_ha", "0")),
                    perc_pastagem_queimada=parse_float(row.get("perc_pastagem_queimada", "0")),
                    nivel_risco_historico=fix_text(row.get("nivel_risco_historico", "")),
                )
            )

    return tuple(records)


@lru_cache(maxsize=1)
def load_fauna_records() -> tuple[FaunaRecord, ...]:
    """Carrega ocorrencias de fauna georreferenciadas com cache."""
    if not FAUNA_FILE.exists():
        return tuple()

    records: list[FaunaRecord] = []
    with FAUNA_FILE.open("r", encoding="utf-8-sig", newline="") as data_file:
        reader = csv.DictReader(data_file)
        for row in reader:
            latitude = row.get("latitude", "").strip()
            longitude = row.get("longitude", "").strip()
            if not latitude or not longitude:
                continue

            ano = parse_int(row.get("ano", "0"))
            mes = parse_int(row.get("mes", "0"))
            records.append(
                FaunaRecord(
                    nome_cientifico=fix_text(row.get("nome_cientifico", "")),
                    nome_popular=fix_text(row.get("nome_popular", "")),
                    grupo=fix_text(row.get("grupo", "")),
                    status_iucn=fix_text(row.get("status_iucn", "")),
                    bioma=fix_text(row.get("bioma", "")),
                    bioma_principal=fix_text(row.get("bioma_principal", "")),
                    habitat_afetado_pct=parse_float(row.get("habitat_afetado_pct", "0")),
                    latitude=float(latitude),
                    longitude=float(longitude),
                    estado=canonical_state_name(row.get("estado", "")),
                    ano=ano,
                    mes=mes,
                    ano_mes=f"{ano:04d}-{mes:02d}",
                )
            )

    return tuple(records)
