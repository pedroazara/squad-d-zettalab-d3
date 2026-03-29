from models.schemas import RegionSnapshot
from services.risk_service import RiskInput, calculate_risk_score, classify_risk, forecast_tendency

# Base inicial mockada. Pode ser substituida por ingestao de CSV/API nas proximas sprints.
REGION_SNAPSHOTS: list[RegionSnapshot] = [
    RegionSnapshot(
        id=1,
        nome="Lavras - Norte",
        latitude=-21.2334,
        longitude=-44.9961,
        temperatura=33.0,
        umidade=25.0,
        vento=24.0,
        precipitacao=0.0,
        focos_calor=18,
    ),
    RegionSnapshot(
        id=2,
        nome="Lavras - Sul",
        latitude=-21.2617,
        longitude=-44.9802,
        temperatura=29.0,
        umidade=41.0,
        vento=16.0,
        precipitacao=2.0,
        focos_calor=7,
    ),
    RegionSnapshot(
        id=3,
        nome="Lavras - Rural Oeste",
        latitude=-21.2540,
        longitude=-45.0400,
        temperatura=35.0,
        umidade=22.0,
        vento=28.0,
        precipitacao=0.0,
        focos_calor=24,
    ),
]


def list_regions() -> list[RegionSnapshot]:
    return REGION_SNAPSHOTS


def get_region(region_id: int) -> RegionSnapshot | None:
    for region in REGION_SNAPSHOTS:
        if region.id == region_id:
            return region
    return None


def build_risk_payload(region: RegionSnapshot) -> dict[str, object]:
    current_score = calculate_risk_score(
        RiskInput(
            temperatura=region.temperatura,
            umidade=region.umidade,
            vento=region.vento,
            precipitacao=region.precipitacao,
            focos_calor=region.focos_calor,
        )
    )

    tomorrow_score = calculate_risk_score(
        RiskInput(
            temperatura=region.temperatura + 1.5,
            umidade=max(0.0, region.umidade - 3.0),
            vento=region.vento + 2.0,
            precipitacao=max(0.0, region.precipitacao - 0.5),
            focos_calor=max(0, region.focos_calor + 2),
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
