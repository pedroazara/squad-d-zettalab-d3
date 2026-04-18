# API - Guia rapido de execucao, rotas e testes

Este documento descreve como subir, testar e validar a API FastAPI do projeto.

## 1. Requisitos

- Python 3.10+
- Ambiente virtual criado e ativado
- Docker e Docker Compose para PostgreSQL local

## 2. Instalacao

Na raiz do projeto:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r api/requirements.txt
```

## 3. Banco de dados

A API usa a variavel de ambiente `DATABASE_URL` para escolher o banco.

- Sem `DATABASE_URL`, a API usa SQLite local em `api/app.db`.
- Com `DATABASE_URL`, a API usa PostgreSQL.
- A ingestao de dados e manual via script de seed para manter o startup rapido.

### Execucao via Docker Compose

Esta e a forma recomendada para reproduzir o ambiente completo da API e do banco localmente.

```bash
docker compose up -d --build
docker compose ps
```

Com isso, a API fica disponivel em `http://127.0.0.1:8000` e o PostgreSQL em `localhost:5432`.

Para parar tudo:

```bash
docker compose down
```

### PostgreSQL local com Docker Compose

Na raiz do projeto:

```bash
docker compose up -d postgres
docker compose ps
```

No PowerShell, configure a conexao da API:

```powershell
$env:DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/guarawatch"
```

Para parar o banco local depois:

```bash
docker compose down
```

## 4. Como executar a API

Importante: se optar pela execucao local com Python, execute o servidor a partir da pasta `api` para evitar erro de importacao de modulos locais.

```bash
cd api
uvicorn main:app --reload
```

API: http://127.0.0.1:8000
Swagger: http://127.0.0.1:8000/docs

## 5. Rotas disponiveis

### Saude

- `GET /health`
- `GET /`

### Autenticacao e usuarios

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /auth/me/permissions`
- `GET /auth/permissions/reports-review`
- `GET /users`  
  Requer permissao `users.read`.
- `PATCH /users/{id}`  
  Requer permissao `users.update`.

### Regioes, risco e focos

- `GET /regions`
- `GET /risk`  
  Filtros: `region_id`, `ano_mes`, `limit`, `offset`
- `GET /fires`  
  Filtros: `ano_mes`, `estado`, `municipio`, `limit`, `offset`
- `GET /fires/points`  
  Filtros: `ano_mes`, `estado`, `municipio`, `limit`, `offset`

### Clima

- `GET /climate`  
  Filtros: `ano`, `mes`, `estacao_codigo`, `limit`, `offset`

### Reportes

- `POST /reports/fire`
- `GET /reports/fire`
- `PATCH /reports/fire/{report_id}/status`  
  Requer permissao `reports.review`.

## 6. Contratos principais

### 6.1 Cadastro

`POST /auth/register`

Payload:

```json
{
  "name": "Usuario Teste",
  "email": "usuario_teste@example.com",
  "organization": "Equipe X",
  "role": "fazendeiro",
  "password": "123456"
}
```

Resposta:

- `message`
- `token`
- `user` com `id`, `name`, `email`, `organization`, `role`

### 6.2 Login

`POST /auth/login`

Payload:

```json
{
  "email": "usuario_teste@example.com",
  "password": "123456"
}
```

Resposta:

- `message`
- `token`
- `user` com `id`, `name`, `email`, `organization`, `role`

### 6.3 Listagem administrativa de usuarios

`GET /users`

Exemplo:

```bash
/users?limit=20&offset=0
```

Resposta:

- `items`
- `total`
- `limit`
- `offset`

### 6.4 Atualizacao administrativa de usuario

`PATCH /users/{id}`

Campos aceitos:

- `name`
- `organization`
- `role`
- `active`

Regras:

- nao e permitido desativar o proprio usuario
- nao e permitido autoelevacao de privilegio alterando o proprio `role`

### 6.5 Reporte de incendio

`POST /reports/fire`

Payload:

```json
{
  "location": "Area de teste",
  "description": "Registro para moderacao de status",
  "phone": "61999990000",
  "reporter_name": "Bot"
}
```

Resposta:

- `id`
- `location`
- `description`
- `phone`
- `reporter_name`
- `status`
- `created_at`

### 6.6 Moderacao de reporte

`PATCH /reports/fire/{report_id}/status`

Payload:

```json
{
  "status": "em_revisao"
}
```

Status aceitos:

- `pendente`
- `em_revisao`
- `aprovado`
- `rejeitado`

## 7. Teste manual rapido

Com a API rodando em outra janela, use exemplos abaixo no PowerShell.

### 7.1 Health

```powershell
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8000/health" | Select-Object -ExpandProperty StatusCode
```

Esperado: `200`

### 7.2 Cadastro

```powershell
$payload = @{
  name = "Usuario Teste"
  email = "usuario_teste@example.com"
  organization = "Equipe X"
  role = "fazendeiro"
  password = "123456"
} | ConvertTo-Json

Invoke-WebRequest -Method POST -UseBasicParsing "http://127.0.0.1:8000/auth/register" -ContentType "application/json" -Body $payload
```

Esperado: `201` na primeira chamada e `409` se repetir o mesmo e-mail.

### 7.3 Login

```powershell
$payload = @{
  email = "usuario_teste@example.com"
  password = "123456"
} | ConvertTo-Json

Invoke-WebRequest -Method POST -UseBasicParsing "http://127.0.0.1:8000/auth/login" -ContentType "application/json" -Body $payload
```

Esperado: `200` com token no corpo.

### 7.4 Risco

```powershell
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8000/risk?limit=5&offset=0" | Select-Object -ExpandProperty StatusCode
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8000/risk?ano_mes=2024-08&limit=5&offset=0" | Select-Object -ExpandProperty StatusCode
```

Esperado: `200`

### 7.5 Mapa agregado

```powershell
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8000/fires?limit=5&offset=0" | Select-Object -ExpandProperty StatusCode
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8000/fires?ano_mes=2024-08&limit=5&offset=0" | Select-Object -ExpandProperty StatusCode
try { Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8000/fires?ano_mes=2024/08" } catch { $_.Exception.Response.StatusCode.value__ }
```

Esperado: `200`, `200`, `422`

### 7.6 Predeploy

Antes de deploy, execute:

```powershell
cd api
$env:DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/guarawatch"
python scripts/predeploy_check.py --skip-seed
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

## 8. Observacoes de funcionamento

- `GET /fires` consulta o banco e depende da carga via seed.
- `GET /regions` e `GET /risk` leem das tabelas `regions`, `fire_events` e `risk_snapshots`.
- `GET /fires/points` expõe os focos georreferenciados.
- `GET /climate` expõe indicadores climaticos mensais.
- `POST /auth/register` e `POST /auth/login` retornam JWT.
- Rotas administrativas exigem token Bearer e permissao adequada.
- `users.active` controla desativacao logica; usuarios inativos nao autenticam e nao usam `/auth/me`.
- Em Docker Compose, o backend usa o servico `postgres` da rede interna como banco principal.

## 9. Escopo atual

- A API esta focada em autenticacao, usuarios, risco, focos, clima e reportes.
- CRUD completo de usuarios foi substituido por listagem, atualizacao administrativa e desativacao logica.
- Reportes usam criacao publica, listagem e moderacao por status.
- Alertas e area de interesse continuam fora do MVP atual.
