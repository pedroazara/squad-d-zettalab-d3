
# GuaráWatch — Squad D | Zetta Lab 2025/2026

>Sistema web para monitoramento, análise e prevenção de incêndios no Cerrado brasileiro, integrando dados ambientais, focos de calor, fauna e relatórios colaborativos.

---

## Estrutura do Projeto

- **api/** — Backend FastAPI (Python 3.10+, PostgreSQL, Docker)
- **web/** — Frontend React 18 + TypeScript (Vite, Tailwind, Wouter, Recharts)
- **data/** — Dados processados, contratos e notebooks
- **docs/** — Documentação técnica e decisões de arquitetura

---

## Como Executar

### Backend (API)

**Pré-requisitos:** Python 3.10+, Docker (opcional)

**Instalação local:**
```bash
cd api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

**Execução local:**
```bash
uvicorn main:app --reload
```
Acesse: [http://localhost:8000](http://localhost:8000)
Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)

**Stack completa com Docker Compose:**
```bash
docker compose up -d --build
```
API: [http://localhost:8000](http://localhost:8000)
Banco: [localhost:5432](localhost:5432)

### Frontend (Web)

**Pré-requisitos:** Node.js 18+

**Instalação e execução:**
```bash
cd web
npm install
npm start
```
Acesse: [http://localhost:4173](http://localhost:4173)

---

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

---

## Funcionalidades do Frontend

- Dashboards interativos nacionais e por estado
- Análise de tendências históricas de risco
- Impacto em biodiversidade e fauna
- Filtros avançados por estado, bioma, grupo, espécie
- Camada opcional de queimadas sobre mapas
- Navegação rápida entre painéis, artigos e conteúdo educativo

Principais rotas: `/dashboard/nacional`, `/dashboard/estados`, `/dashboard/biodiversidade`, `/dashboard/tendencias`, `/dashboard/ocorrencias`, `/educativo`, `/sobre`, `/api`, `/contato`

---

## Dados e Escopo

- Pontos de fogo: `data/interim/focos/focos_limpos_detalhados.csv` (fallback: `data/processed/...`)
- Ocorrências de fauna: `data/fauna_cerrado/fauna_cerrado_2019.csv`
- Dados mockados no frontend para validação de produto

---

## Testes e Qualidade

- Backend: pytest, cobertura de autenticação, risco, ingestão, reportes e permissões
- Frontend: scripts npm para build e testes

---

## Squad

| Membro           | Trilha                         |
|------------------|-------------------------------|
| Pedro Henrique   | Gestão de Projetos             |
| João Guilherme   | Desenvolvimento de Software    |
| Kauê             | Desenvolvimento de Software    |
| Luíza            | Geotecnologia                  |
| João Vitor       | Ciência e Governança de Dados  |
| Michelle         | Comunicação e Marketing        |

---

## Licença

Projeto acadêmico — Zetta Lab 2025/2026. Uso livre para fins educacionais e de pesquisa.
