# Data Contract

Este documento define as colunas mínimas e regras de qualidade para os datasets usados pela API.

## 1) Contrato do risco por município/mês

Arquivo: `processed/focos/focos_por_municipio_mes.csv`

### Colunas obrigatórias

- `Estado_Clean` (string)
- `Municipio_Clean` (string)
- `Ano` (inteiro)
- `Mes` (inteiro)
- `AnoMes` (string no formato `YYYY-MM`)
- `Quantidade_Focos` (inteiro >= 0)
- `RiscoFogo_Mediano` (float >= 0)
- `FRP_Mediano` (float >= 0)
- `Bioma_Predominante` (string)

### Regras

- `Estado_Clean`, `Municipio_Clean` e `AnoMes` nao podem ser vazios.
- `Mes` deve estar entre 1 e 12.
- Valores numericos vazios devem ser preenchidos com `0` no processamento, quando aplicavel.

## 2) Contrato do clima mensal

Arquivo: `processed/clima/inmet_mensal_resumo.csv`

### Colunas obrigatórias

- `ano` (inteiro)
- `mes` (inteiro)
- `estacao_codigo` (string)
- `temp_max_c` (float, nulo permitido)
- `temp_min_c` (float, nulo permitido)
- `umidade_min_pct` (float, nulo permitido)
- `precipitacao_mm` (float, nulo permitido)

### Regras

- `ano`, `mes` e `estacao_codigo` nao podem ser nulos.
- `mes` deve estar entre 1 e 12.
- Valores climaticos nulos sao permitidos no nivel mensal.

## 3) Contrato de risco consolidado por estado

Arquivo: `processed/risco/resumo_risco_estados.csv`

### Colunas obrigatórias

- `bioma` (string)
- `estado` (string)
- `uf` (string)
- `total_area_queimada_ha` (float >= 0)
- `media_anual_queimada_ha` (float >= 0)
- `total_pastagem_risco_ha` (float >= 0)
- `anos_com_dado` (inteiro > 0)
- `risco_geral` (enum: `Baixo`, `Médio`, `Alto`)

## 4) Compatibilidade com API

- Mudancas de nome de coluna devem atualizar os servicos da API no mesmo commit.
- Mudancas de caminho de arquivo devem atualizar os paths no backend.
- Sempre validar ao menos:
  - `GET /risk`
  - `GET /risk?region_id=1`

## 5) Politica de evolucao

- Novas colunas podem ser adicionadas sem quebrar contratos existentes.
- Remocao/renomeacao de colunas obrigatorias exige atualizacao de contrato e de codigo.
- Datasets em `interim/` nao tem contrato estavel de API.
