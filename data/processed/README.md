# Datasets Processados

Este diretório contém datasets finais para consumo da API e do dashboard.

## Focos

- `focos/focos_por_municipio_mes.csv`
  - Granularidade: município/mês.
  - Uso: base principal do endpoint de risco.
  - Campos-chave: `Estado_Clean`, `Municipio_Clean`, `AnoMes`, `Quantidade_Focos`, `RiscoFogo_Mediano`, `FRP_Mediano`.

## Risco

- `risco/dados_risco_cruzado.csv`
  - Granularidade: estado/ano.
  - Uso: análise integrada de risco (queimada + pastagem).
  - Campos-chave: `bioma`, `estado`, `ano`, `area_queimada_ha`, `area_pastagem_risco_ha`, `nivel_risco_historico`.

- `risco/resumo_risco_estados.csv`
  - Granularidade: estado consolidado no período.
  - Uso: ranking e visão executiva de risco por estado.
  - Campos-chave: `estado`, `total_area_queimada_ha`, `media_anual_queimada_ha`, `total_pastagem_risco_ha`, `risco_geral`.

## Clima

- `clima/inmet_mensal_resumo.csv`
  - Granularidade: estação/mês.
  - Uso: indicadores climáticos agregados para dashboard.
  - Campos-chave: `ano`, `mes`, `estacao_codigo`, `temp_max_c`, `temp_min_c`, `umidade_min_pct`, `precipitacao_mm`.

## Cicatriz de fogo

- `cicatriz/cicatriz_fogo_anual.csv`
  - Granularidade: bioma/estado/ano.
  - Uso: evolução anual de área queimada.
  - Campos-chave: `bioma`, `estado`, `ano`, `area_queimada_ha`.

- `cicatriz/cicatriz_fogo_mensal.csv`
  - Granularidade: bioma/estado/mês/ano.
  - Uso: sazonalidade e tendências mensais de queimada.
  - Campos-chave: `bioma`, `estado`, `mes_nome`, `mes_numero`, `ano`, `area_queimada_ha`.

## Pastagem

- `pastagem/pastagem_risco.csv`
  - Granularidade: bioma/estado/ano.
  - Uso: contexto de exposição de pastagem ao risco.
  - Campos-chave: `bioma`, `estado`, `uf`, `ano`, `area_pastagem_risco_ha`.
