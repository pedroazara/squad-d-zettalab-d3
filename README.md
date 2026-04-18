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
- `GET /fires` (mapa de risco agregado por municipio/mes, sem lat/long por foco; filtros: `ano_mes`, `estado`, `municipio`; paginação: `limit`, `offset`)
- `POST /reports/fire`
- `GET /reports/fire`

## Escopo do mapa por sprint

- Sprint 1: mapa agregado usando `data/processed/focos/focos_por_municipio_mes.csv` (reproduzivel e commitavel).
- Trade-off assumido: menor precisao espacial (sem ponto individual com latitude/longitude) em troca de estabilidade da entrega.
- Proxima sprint: endpoint opcional de pontos detalhados com base `interim/` local, quando disponivel.

## Squad

| Membro | Trilha |
|---|---|
| Pedro Henrique | Gestão de Projetos |
| João Guilherme | Desenvolvimento de Software |
| Kauê | Desenvolvimento de Software |
| Luíza | Geotecnologia |
| João Vitor | Ciência e Governânça de Dados |
| Michelle | Comunicação e Marketing |
