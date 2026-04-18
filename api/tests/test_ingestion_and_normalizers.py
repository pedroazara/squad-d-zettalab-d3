from pathlib import Path

import pytest

from services.ingestion import file_loaders, normalizers


def _write_csv(tmp_path: Path, name: str, content: str) -> Path:
    path = tmp_path / name
    path.write_text(content, encoding="utf-8-sig")
    return path


def test_normalizers_and_coordinates():
    assert normalizers.normalize("  Goiás ") == "GOIAS"
    assert normalizers.fix_text("GoiÃ¡s") == "Goiás"
    assert normalizers.normalize_key("  GoiÃ¡s ") == "GOIAS"
    assert normalizers.state_coordinates("Minas Gerais") == pytest.approx((-18.10, -44.38))
    assert normalizers.state_coordinates("Estado Inexistente") == pytest.approx((-15.0, -55.0))


def test_parse_helpers():
    assert file_loaders.parse_int("10.0") == 10
    assert file_loaders.parse_float("") == 0.0
    assert file_loaders.parse_float(" 3.5 ") == pytest.approx(3.5)
    assert file_loaders.parse_nullable_float("") is None
    assert file_loaders.parse_nullable_float(" 4.2 ") == pytest.approx(4.2)


def test_load_records_parses_and_caches(tmp_path, monkeypatch):
    csv_path = _write_csv(
        tmp_path,
        "focos.csv",
        "Municipio_Clean,Estado_Clean,Ano,Mes,AnoMes,Quantidade_Focos,RiscoFogo_Mediano,FRP_Mediano,Bioma_Predominante\n"
        "Lavras,Minas Gerais,2024,8,2024-08,12,0.45,22.0,Cerrado\n",
    )
    monkeypatch.setattr(file_loaders, "DATA_FILE", csv_path)
    file_loaders.load_records.cache_clear()

    records = file_loaders.load_records()

    assert len(records) == 1
    assert records[0].municipio == "Lavras"
    assert records[0].estado == "Minas Gerais"
    assert records[0].quantidade_focos == 12
    assert file_loaders.load_records() is records


def test_load_fire_point_records_skips_missing_coordinates_and_parses(tmp_path, monkeypatch):
    csv_path = _write_csv(
        tmp_path,
        "fire_points.csv",
        "DataHora,Satelite,Estado_Clean,Municipio_Clean,Bioma,RiscoFogo,FRP,Latitude,Longitude,AnoMes\n"
        "2024-07-01T10:00:00,AQUA,GoiÃ¡s,Goiania,Cerrado,0.7,12.5,-16.6,-49.2,2024-07\n"
        "2024-07-01T11:00:00,AQUA,GoiÃ¡s,Goiania,Cerrado,0.7,12.5,,,2024-07\n",
    )
    monkeypatch.setattr(file_loaders, "FIRE_POINTS_FILE", csv_path)
    file_loaders.load_fire_point_records.cache_clear()

    records = file_loaders.load_fire_point_records()

    assert len(records) == 1
    assert records[0].estado == "Goiás"
    assert records[0].municipio == "Goiania"
    assert records[0].latitude == pytest.approx(-16.6)
    assert records[0].longitude == pytest.approx(-49.2)


@pytest.mark.parametrize(
    "loader_name, file_attr, csv_content, expected_field, expected_value",
    [
        (
            "load_climate_records",
            "CLIMATE_FILE",
            "ano,mes,estacao_codigo,temp_max_c,temp_min_c,umidade_min_pct,precipitacao_mm\n2024,7,A001,32.0,20.0,35.0,1.2\n",
            "estacao_codigo",
            "A001",
        ),
        (
            "load_state_risk_records",
            "STATE_RISK_FILE",
            "estado,risco_geral\nMinas Gerais,alto\n",
            "risco_geral",
            "alto",
        ),
        (
            "load_burn_scar_monthly_records",
            "SCAR_MONTHLY_FILE",
            "bioma,estado,ano,mes_numero,area_queimada_ha\nCerrado,Minas Gerais,2024,7,120.5\n",
            "area_queimada_ha",
            120.5,
        ),
        (
            "load_burn_scar_annual_records",
            "SCAR_ANNUAL_FILE",
            "bioma,estado,ano,area_queimada_ha\nCerrado,Minas Gerais,2024,800.0\n",
            "area_queimada_ha",
            800.0,
        ),
        (
            "load_pasture_risk_records",
            "PASTURE_RISK_FILE",
            "bioma,estado,uf,ano,area_pastagem_risco_ha\nCerrado,Minas Gerais,MG,2024,50.0\n",
            "uf",
            "MG",
        ),
        (
            "load_cross_risk_records",
            "RISK_CROSSED_FILE",
            "bioma,estado,uf,ano,area_queimada_ha,area_pastagem_risco_ha,perc_pastagem_queimada,nivel_risco_historico\nCerrado,Minas Gerais,MG,2024,10.0,5.0,2.0,medio\n",
            "nivel_risco_historico",
            "medio",
        ),
    ],
)
def test_loader_variants(tmp_path, monkeypatch, loader_name, file_attr, csv_content, expected_field, expected_value):
    csv_path = _write_csv(tmp_path, f"{loader_name}.csv", csv_content)
    monkeypatch.setattr(file_loaders, file_attr, csv_path)
    getattr(file_loaders, loader_name).cache_clear()

    records = getattr(file_loaders, loader_name)()

    assert len(records) == 1
    assert getattr(records[0], expected_field) == expected_value


def test_missing_file_loaders_return_empty_tuple(tmp_path, monkeypatch):
    missing_path = tmp_path / "missing.csv"
    monkeypatch.setattr(file_loaders, "FIRE_POINTS_FILE", missing_path)
    file_loaders.load_fire_point_records.cache_clear()

    assert file_loaders.load_fire_point_records() == tuple()
