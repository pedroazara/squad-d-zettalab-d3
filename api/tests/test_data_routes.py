from routes import climate as climate_route
from routes import fires as fires_route
from routes import regions as regions_route
from routes import risk as risk_route


def test_get_regions_maps_payload(client, monkeypatch, admin_token):
    monkeypatch.setattr(
        regions_route,
        "list_region_snapshots",
        lambda db, limit, offset, ano_mes=None: [
            {
                "id": 1,
                "nome": "Regiao A",
                "latitude": -15.0,
                "longitude": -47.0,
                "temperatura": 30.0,
                "umidade": 40.0,
                "vento": 10.0,
                "precipitacao": 0.0,
                "focos_calor": 12,
            }
        ],
    )

    response = client.get("/regions", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["nome"] == "Regiao A"


def test_get_region_by_id_maps_payload(client, monkeypatch, admin_token):
    monkeypatch.setattr(
        regions_route,
        "get_region_snapshot",
        lambda db, region_id, ano_mes=None: {
            "id": region_id,
            "nome": "Regiao A",
            "latitude": -15.0,
            "longitude": -47.0,
            "temperatura": 30.0,
            "umidade": 40.0,
            "vento": 10.0,
            "precipitacao": 0.0,
            "focos_calor": 12,
        },
    )

    response = client.get("/regions/7", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    assert response.json()["id"] == 7


def test_get_risk_ok(client, monkeypatch, admin_token):
    monkeypatch.setattr(
        risk_route,
        "list_risk_payloads",
        lambda db, region_id, ano_mes, limit, offset: [
            {
                "regiao_id": 1,
                "regiao_nome": "Regiao A",
                "score": 72.5,
                "risco": "alto",
                "score_amanha": 74.0,
                "risco_amanha": "alto",
                "tendencia": "crescente",
            }
        ],
    )

    response = client.get("/risk?region_id=1", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    assert response.json()[0]["risco"] == "alto"


def test_get_risk_by_region_ok(client, monkeypatch, admin_token):
    monkeypatch.setattr(
        risk_route,
        "get_risk_payload",
        lambda db, region_id, ano_mes=None: {
            "regiao_id": region_id,
            "regiao_nome": "Regiao A",
            "score": 72.5,
            "risco": "alto",
            "score_amanha": 74.0,
            "risco_amanha": "alto",
            "tendencia": "crescente",
        },
    )

    response = client.get("/risk/1", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    assert response.json()["regiao_id"] == 1


def test_get_risk_region_not_found(client, monkeypatch, admin_token):
    monkeypatch.setattr(risk_route, "list_risk_payloads", lambda db, region_id, ano_mes, limit, offset: [])

    response = client.get("/risk?region_id=999", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 404


def test_get_climate_ok(client, monkeypatch, admin_token):
    monkeypatch.setattr(
        climate_route,
        "list_climate_items",
        lambda db, ano, mes, estacao_codigo, limit, offset: [
            {
                "estacao_codigo": "A001",
                "ano": 2024,
                "mes": 7,
                "temp_max_c": 32.0,
                "temp_min_c": 20.0,
                "temp_media_c": 26.0,
                "umidade_min_pct": 35.0,
                "precipitacao_mm": 1.2,
            }
        ],
    )

    response = client.get("/climate?ano=2024&mes=7", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    assert response.json()[0]["estacao_codigo"] == "A001"


def test_get_climate_by_id_ok(client, monkeypatch, admin_token):
    monkeypatch.setattr(
        climate_route,
        "get_climate_item",
        lambda db, climate_id: {
            "estacao_codigo": "A001",
            "ano": 2024,
            "mes": 7,
            "temp_max_c": 32.0,
            "temp_min_c": 20.0,
            "temp_media_c": 26.0,
            "umidade_min_pct": 35.0,
            "precipitacao_mm": 1.2,
        },
    )

    response = client.get("/climate/5", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    assert response.json()["estacao_codigo"] == "A001"


def test_get_fires_and_points(client, monkeypatch, admin_token):
    monkeypatch.setattr(
        fires_route,
        "list_fire_items",
        lambda db, ano_mes, estado, municipio, limit, offset: [
            {
                "id": 1,
                "estado": "GO",
                "municipio": "Goiania",
                "ano_mes": "2024-07",
                "quantidade_focos": 10,
                "risco_fogo_mediano": 0.8,
                "frp_mediano": 20.0,
                "score": 75.0,
                "risco": "alto",
            }
        ],
    )

    monkeypatch.setattr(
        fires_route,
        "list_fire_point_items",
        lambda db, ano_mes, estado, municipio, limit, offset: [
            {
                "id": 1,
                "data_hora": "2024-07-01 10:00:00",
                "satelite": "AQUA_M-T",
                "estado": "GO",
                "municipio": "Goiania",
                "bioma": "Cerrado",
                "risco_fogo": 0.7,
                "frp": 15.0,
                "latitude": -16.67,
                "longitude": -49.25,
                "ano_mes": "2024-07",
            }
        ],
    )

    headers = {"Authorization": f"Bearer {admin_token}"}
    fires_response = client.get("/fires?ano_mes=2024-07", headers=headers)
    points_response = client.get("/fires/points?ano_mes=2024-07", headers=headers)

    assert fires_response.status_code == 200
    assert points_response.status_code == 200
    assert fires_response.json()[0]["municipio"] == "Goiania"
    assert points_response.json()[0]["bioma"] == "Cerrado"


def test_get_fire_and_point_by_id(client, monkeypatch, admin_token):
    monkeypatch.setattr(
        fires_route,
        "get_fire_item",
        lambda db, fire_id: {
            "id": fire_id,
            "estado": "GO",
            "municipio": "Goiania",
            "ano_mes": "2024-07",
            "quantidade_focos": 10,
            "risco_fogo_mediano": 0.8,
            "frp_mediano": 20.0,
            "score": 75.0,
            "risco": "alto",
        },
    )
    monkeypatch.setattr(
        fires_route,
        "get_fire_point_item",
        lambda db, point_id: {
            "id": point_id,
            "data_hora": "2024-07-01 10:00:00",
            "satelite": "AQUA_M-T",
            "estado": "GO",
            "municipio": "Goiania",
            "bioma": "Cerrado",
            "risco_fogo": 0.7,
            "frp": 15.0,
            "latitude": -16.67,
            "longitude": -49.25,
            "ano_mes": "2024-07",
        },
    )

    headers = {"Authorization": f"Bearer {admin_token}"}
    fire_response = client.get("/fires/1", headers=headers)
    point_response = client.get("/fires/points/1", headers=headers)

    assert fire_response.status_code == 200
    assert point_response.status_code == 200
    assert fire_response.json()["id"] == 1
    assert point_response.json()["id"] == 1
