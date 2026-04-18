from dataclasses import dataclass

from models.entities import FireEvent, FirePoint, ClimateMonthly, Region, RiskSnapshot


@dataclass(frozen=True)
class RegionContext:
    region_id: int
    estado: str
    municipio: str
    ano: int
    mes: int
    ano_mes: str
    quantidade_focos: int
    risco_fogo_mediano: float
    frp_mediano: float
    bioma: str | None

    @property
    def nome(self) -> str:
        return f"{self.municipio} - {self.estado} ({self.ano_mes})"


def build_region_snapshot(
    region: RegionContext,
    latitude: float,
    longitude: float,
) -> dict[str, float | int | str]:
    offset = (region.region_id % 9) * 0.03
    temperatura = round(24 + (region.risco_fogo_mediano * 12) + (region.frp_mediano / 180), 1)
    umidade = round(max(12.0, 75 - (region.risco_fogo_mediano * 50)), 1)
    vento = round(6 + min(24.0, region.frp_mediano / 12), 1)
    precipitacao = round(max(0.0, 120 - (region.risco_fogo_mediano * 110)), 1)

    return {
        "id": region.region_id,
        "nome": region.nome,
        "latitude": round(latitude + offset, 4),
        "longitude": round(longitude - offset, 4),
        "temperatura": temperatura,
        "umidade": umidade,
        "vento": vento,
        "precipitacao": precipitacao,
        "focos_calor": region.quantidade_focos,
    }


def build_region_snapshot_with_climate(
    region: RegionContext,
    latitude: float,
    longitude: float,
    avg_temp: float | None,
    avg_humidity: float | None,
    avg_precipitation: float | None,
) -> dict[str, float | int | str]:
    snapshot = build_region_snapshot(region, latitude, longitude)
    offset = ((region.region_id % 5) - 2) * 0.4

    if avg_temp is not None:
        snapshot["temperatura"] = round(avg_temp + offset, 1)
    if avg_humidity is not None:
        snapshot["umidade"] = round(max(5.0, min(100.0, avg_humidity - (offset * 2))), 1)
    if avg_precipitation is not None:
        snapshot["precipitacao"] = round(max(0.0, avg_precipitation - (offset * 3)), 1)

    return snapshot


def build_risk_payload(
    region: RegionContext,
    current_score: float,
    current_risk: str,
    tomorrow_score: float,
    tomorrow_risk: str,
    tendency: str,
) -> dict[str, object]:
    return {
        "regiao_id": region.region_id,
        "regiao_nome": region.nome,
        "score": current_score,
        "risco": current_risk,
        "score_amanha": tomorrow_score,
        "risco_amanha": tomorrow_risk,
        "tendencia": tendency,
    }


def build_risk_payload_from_snapshot(region: Region, snapshot: RiskSnapshot) -> dict[str, object]:
    return {
        "regiao_id": region.id,
        "regiao_nome": f"{region.municipio} - {region.estado} ({snapshot.ano_mes})",
        "score": snapshot.score,
        "risco": snapshot.risco,
        "score_amanha": snapshot.score_amanha,
        "risco_amanha": snapshot.risco_amanha,
        "tendencia": snapshot.tendencia,
    }


def build_fire_item(region: Region, fire_event: FireEvent, score: float, risk: str) -> dict[str, object]:
    return {
        "id": fire_event.id,
        "estado": region.estado,
        "municipio": region.municipio,
        "ano_mes": fire_event.ano_mes,
        "quantidade_focos": fire_event.quantidade_focos,
        "risco_fogo_mediano": fire_event.risco_fogo_mediano,
        "frp_mediano": fire_event.frp_mediano,
        "score": score,
        "risco": risk,
    }


def build_fire_point_item(item: FirePoint) -> dict[str, object]:
    return {
        "id": item.id,
        "data_hora": item.data_hora,
        "satelite": item.satelite,
        "estado": item.estado,
        "municipio": item.municipio,
        "bioma": item.bioma,
        "risco_fogo": item.risco_fogo,
        "frp": item.frp,
        "latitude": item.latitude,
        "longitude": item.longitude,
        "ano_mes": item.ano_mes,
    }


def build_climate_item(item: ClimateMonthly, temp_media: float | None) -> dict[str, object]:
    return {
        "estacao_codigo": item.estacao_codigo,
        "ano": item.ano,
        "mes": item.mes,
        "temp_max_c": item.temp_max_c,
        "temp_min_c": item.temp_min_c,
        "temp_media_c": temp_media,
        "umidade_min_pct": item.umidade_min_pct,
        "precipitacao_mm": item.precipitacao_mm,
    }