# API - Guia rapido de execucao e testes

Este documento explica como subir e testar a API FastAPI do projeto.

## 1. Pre-requisitos

- Python 3.10+
- Ambiente virtual criado (recomendado)

## 2. Instalacao

Na raiz do projeto:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r api/requirements.txt
```

## 3. Como executar a API

Importante: execute o servidor a partir da pasta api para evitar erro de importacao de modulos locais.

### Configuracao de banco

- Sem configurar variavel de ambiente, a API usa SQLite local em `api/app.db`.
- Para usar PostgreSQL, defina `DATABASE_URL` antes de subir a API.
- A ingestao de dados e manual via script de seed para manter startup rapido da API.

### PostgreSQL local com Docker Compose (recomendado)

Na raiz do projeto, suba o banco:

```bash
docker compose up -d postgres
docker compose ps
```

Depois, no PowerShell, configure a conexao da API:

```powershell
$env:DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/cerrado_forca"
```

Opcional: use o arquivo de exemplo em `api/.env.example` para referencia de variaveis.

Exemplo (PowerShell):

```powershell
$env:DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/cerrado_forca"
```

```bash
cd api
uvicorn main:app --reload
```

Para parar o banco local depois:

```bash
docker compose down
```

API: http://127.0.0.1:8000  
Swagger: http://127.0.0.1:8000/docs

## 4. Endpoints disponiveis

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /regions`
- `GET /risk` (filtros: `region_id`, `ano_mes`, `limit`, `offset`)
- `GET /fires` (mapa agregado por municipio/mes; filtros: `ano_mes`, `estado`, `municipio`, `limit`, `offset`)
- `GET /fires/points` (focos georreferenciados com `latitude` e `longitude`; filtros: `ano_mes`, `estado`, `municipio`, `limit`, `offset`)
- `POST /reports/fire`
- `GET /reports/fire`

## 5. Teste manual rapido (PowerShell)

Com a API rodando em outra janela:

### 5.1 Health

```powershell
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8000/health" | Select-Object -ExpandProperty StatusCode
```

Esperado: `200`

### 5.2 Criar conta

```powershell
$payload = @{
  email = "usuario_teste@cerrado.com"
  password = "123456"
  full_name = "Usuario Teste"
  role = "fazendeiro"
} | ConvertTo-Json

Invoke-WebRequest -Method POST -UseBasicParsing "http://127.0.0.1:8000/auth/register" -ContentType "application/json" -Body $payload
```

Esperado: `201` na primeira chamada e `409` se repetir o mesmo e-mail.

### 5.3 Login

```powershell
$payload = @{
  email = "usuario_teste@cerrado.com"
  password = "123456"
} | ConvertTo-Json

Invoke-WebRequest -Method POST -UseBasicParsing "http://127.0.0.1:8000/auth/login" -ContentType "application/json" -Body $payload
```

Esperado: `200` com token no corpo.

### 5.4 Risco

```powershell
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8000/risk?limit=5&offset=0" | Select-Object -ExpandProperty StatusCode
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8000/risk?ano_mes=2024-08&limit=5&offset=0" | Select-Object -ExpandProperty StatusCode
```

Esperado: `200`

### 5.5 Mapa agregado

```powershell
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8000/fires?limit=5&offset=0" | Select-Object -ExpandProperty StatusCode
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8000/fires?ano_mes=2024-08&limit=5&offset=0" | Select-Object -ExpandProperty StatusCode
try { Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8000/fires?ano_mes=2024/08" } catch { $_.Exception.Response.StatusCode.value__ }
```

Esperado: `200`, `200`, `422`

## 5.6 Script de predeploy (smoke test automatizado)

Antes de deploy, execute:

```powershell
cd api
$env:DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/cerrado_forca"
python scripts/predeploy_check.py --seed-runs 1
```

Opcional para validar idempotencia do seed:

```powershell
python scripts/predeploy_check.py --seed-runs 2
```

O script valida:
- conectividade e tabelas obrigatorias no banco
- execucao do seed (opcional)
- contagens minimas de dados essenciais
- smoke test dos endpoints: `/health`, `/regions`, `/risk`, `/fires`, `/fires/points`, `/auth/*`, `/reports/fire`

## 6. Observacao de escopo (Sprint 1)

- O endpoint `GET /fires` agora consulta o banco, alimentado pelo script manual de seed.
- `GET /regions` e `GET /risk` tambem passam a ler das tabelas `regions`, `fire_events` e `risk_snapshots`.
- Ha endpoint de pontos georreferenciados em `GET /fires/points`.
- Escopo atual prioriza reproducao no repositorio (dados commitaveis).
- Pontos detalhados ficam para evolucao com base interim/local em sprint seguinte.
