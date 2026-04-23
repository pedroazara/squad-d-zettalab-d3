# GuaráWatch — Squad D | Zetta Lab 2025

Sistema web de monitoramento e prevenção de incêndios no Cerrado.

## Estrutura do projeto

- `api/` — backend FastAPI (Python)
- `web/` — frontend (a definir)
- `data/` — dados processados e notebooks de analise
- `docs/` — decisoes tecnicas e documentacao

## Como executar o backend

### Pré-requisitos
- Python 3.10+

### Instalação
```bash
cd api
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Execução
```bash
uvicorn main:app --reload
```

API disponível em `http://localhost:8000`
Documentação automática em `http://localhost:8000/docs`

## Endpoints principais do backend

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /regions`
- `GET /risk` (filtros: `region_id`, `ano_mes`; paginação: `limit`, `offset`)
- `GET /fires` (agregado por municipio/mes; filtros: `ano_mes`, `estado`, `municipio`; paginação: `limit`, `offset`)
- `GET /fires/points` (público; pontos georreferenciados com lat/lon; filtros: `ano_mes`, `estado`, `municipio`)
- `GET /fauna/filters` (público; estados, biomas, grupos e status IUCN)
- `GET /fauna/occurrences` (público; ocorrências de fauna com lat/lon e filtros)
- `GET /fauna/timeline` (público; série temporal anual/mensal)
- `GET /fauna/distribution/groups` (público; distribuição por grupo)
- `GET /fauna/distribution/states` (público; distribuição por estado)
- `GET /fauna/biodiversity/summary` (público; resumo de biodiversidade)
- `GET /fauna/biodiversity/species` (público; espécies com centroide de localização)
- `POST /reports/fire`
- `GET /reports/fire`

## Escopo do mapa por sprint

- Mapa nacional e de ocorrências usam geometria real de estados (GeoJSON) e pontos georreferenciados.
- Pontos de fogo são carregados de `data/interim/focos/focos_limpos_detalhados.csv` com fallback para `data/processed/focos/focos_limpos_detalhados.csv`.
- Ocorrências de fauna são carregadas de `data/fauna_cerrado/fauna_cerrado_2019.csv`.

## Squad

| Membro | Trilha |
|---|---|
| Pedro Henrique | Gestão de Projetos |
| João Guilherme | Desenvolvimento de Software |
| Kauê | Desenvolvimento de Software |
| Luíza | Geotecnologia |
| João Vitor | Ciência e Governânça de Dados |
| Michelle | Comunicação e Marketing |
