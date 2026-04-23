# GuaraWatch API

Documentação oficial de execução, configuração, segurança, rotas e validação da API.

## 1. Ambientes

- Produção (Render): https://guarawatch-api.onrender.com
- Swagger de produção: https://guarawatch-api.onrender.com/docs
- Healthcheck de produção: https://guarawatch-api.onrender.com/health

## 2. Requisitos

- Python 3.10+
- Ambiente virtual ativo
- Docker e Docker Compose (opcional para banco e stack local)

## 3. Instalação local

Na raiz do repositório:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r api/requirements.txt
```

### 3.1 Estrutura da API

```text
api/
├─ main.py
├─ db.py
├─ Dockerfile
├─ requirements.txt
├─ .env.example
├─ models/
│  ├─ entities.py
│  └─ schemas.py
├─ routes/
│  ├─ auth.py
│  ├─ users.py
│  ├─ regions.py
│  ├─ risk.py
│  ├─ fires.py
│  ├─ fauna.py
│  ├─ climate.py
│  └─ reports.py
├─ services/
│  ├─ auth_service.py
│  ├─ authz_service.py
│  ├─ security_service.py
│  ├─ seed_service.py
│  ├─ region_service.py
│  ├─ region_presenter.py
│  ├─ report_service.py
│  ├─ risk_service.py
│  ├─ risk_hybrid_service.py
│  ├─ ingestion/
│  │  ├─ file_loaders.py
│  │  └─ normalizers.py
│  └─ repositories/
│     └─ region_repository.py
├─ scripts/
│  ├─ seed.py
│  └─ predeploy_check.py
└─ tests/
  ├─ conftest.py
  ├─ test_auth.py
  ├─ test_users.py
  ├─ test_reports.py
  ├─ test_data_routes.py
  ├─ test_db.py
  ├─ test_region_service.py
  ├─ test_region_repository.py
  ├─ test_region_presenter.py
  ├─ test_risk_service.py
  ├─ test_risk_hybrid_service.py
  ├─ test_seed_service.py
  └─ test_ingestion_and_normalizers.py
```

Obs.: arquivos temporários (`__pycache__`) e banco local (`app.db`) não entram nessa visão estrutural.

## 4. Configuração de ambiente

Variáveis utilizadas pela API:

- `DATABASE_URL`: conexão com banco.
- `JWT_SECRET`: chave de assinatura JWT.
- `JWT_ALGORITHM`: algoritmo JWT (recomendado: `HS256`).
- `JWT_EXPIRE_MINUTES`: expiração do token em minutos.
- `CORS_ALLOW_ORIGINS`: lista separada por vírgula de origens permitidas.

Observações:

- Sem `DATABASE_URL`, a API usa SQLite local em `api/app.db`.
- Com `DATABASE_URL`, a API usa PostgreSQL.
- Quando `DATABASE_URL` vier como `postgresql://...`, a aplicação converte automaticamente para o dialeto `postgresql+psycopg://...`.

### 4.1 Banco de produção (Neon)

Em produção, a API usa PostgreSQL gerenciado no Neon via `DATABASE_URL`.

Boas práticas:

- usar URL completa com `sslmode=require`
- manter credenciais no Render Environment (nunca versionar)
- rotacionar senha do banco ao expor credencial por engano
- validar schema da tabela `users` antes de homologar login

Checks úteis no Neon SQL Editor:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;
```

Os campos essenciais para auth são: `id`, `email`, `role`, `active`, `password_hash`.

## 5. Execução local

### 5.1 Somente API (Python)

```bash
cd api
uvicorn main:app --reload
```

- API local: http://127.0.0.1:8000
- Swagger local: http://127.0.0.1:8000/docs

### 5.2 Stack local com Docker Compose

Na raiz do repositório:

```bash
docker compose up -d --build
docker compose ps
```

Para parar:

```bash
docker compose down
```

## 6. Autenticação e autorização

### 6.1 Fluxo de autenticação

1. Chamar `POST /auth/login` com `email` e `password`.
2. Copiar o `token` retornado.
3. No Swagger, clicar em `Authorize` e colar o token no schema `BearerAuth`.

### 6.2 Perfis válidos

- `administrador`
- `coordenacao`
- `brigadista`
- `fazendeiro`

`POST /auth/register` não permite criar `administrador` via cadastro público.

### 6.3 Permissões por perfil

- `administrador`: `users.read`, `users.create`, `users.update`, `users.delete`, `reports.read`, `reports.review`, `risk.read`, `risk.manage`
- `coordenacao`: `users.read`, `reports.read`, `reports.review`, `risk.read`
- `brigadista`: `reports.read`, `risk.read`
- `fazendeiro`: `reports.read`, `risk.read`

## 7. Endpoints

### 7.1 Health

- `GET /health`
- `GET /`

### 7.2 Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /auth/me/permissions`
- `GET /auth/permissions/reports-review`

### 7.3 Usuários (admin/coordenacao conforme permissão)

- `GET /users?limit=20&offset=0`
- `GET /users/{user_id}`
- `PATCH /users/{user_id}`

Regras de segurança no update:

- não permite autoelevação de `role`
- não permite autodesativação (`active=false`)

### 7.4 Regiões

- `GET /regions?limit=100&offset=0&ano_mes=YYYY-MM`
- `GET /regions/{region_id}?ano_mes=YYYY-MM`

### 7.5 Risco

- `GET /risk?region_id=&ano_mes=YYYY-MM&limit=100&offset=0`
- `GET /risk/{region_id}?ano_mes=YYYY-MM`

### 7.6 Focos

- `GET /fires?ano_mes=YYYY-MM&estado=&municipio=&limit=100&offset=0`
- `GET /fires/{fire_id}`
- `GET /fires/points?ano_mes=YYYY-MM&estado=&municipio=&limit=1000&offset=0` (publico)
- `GET /fires/points/{point_id}` (publico)

Origem dos pontos georreferenciados: `data/interim/focos/focos_limpos_detalhados.csv`
com fallback para `data/processed/focos/focos_limpos_detalhados.csv`.

### 7.7 Clima

- `GET /climate?ano=&mes=&estacao_codigo=&limit=100&offset=0`
- `GET /climate/{climate_id}`

### 7.8 Reportes

- `POST /reports/fire`
- `GET /reports/fire?limit=100&offset=0`
- `GET /reports/fire/{report_id}`
- `PATCH /reports/fire/{report_id}/status` (requer `reports.review`)

### 7.9 Fauna (endpoints publicos)

- `GET /fauna/filters`
- `GET /fauna/occurrences?estado=&bioma=&grupo=&status_iucn=&ano=&mes=&search=&limit=500&offset=0`
- `GET /fauna/timeline?granularity=anual|mensal&estado=&bioma=&grupo=`
- `GET /fauna/distribution/groups?estado=&bioma=`
- `GET /fauna/distribution/states?bioma=&grupo=`
- `GET /fauna/biodiversity/summary?estado=&bioma=&grupo=`
- `GET /fauna/biodiversity/species?estado=&bioma=&grupo=&status_iucn=`

Origem dos dados: `data/fauna_cerrado/fauna_cerrado_2019.csv`.

## 8. Contratos essenciais

### 8.1 Register

`POST /auth/register`

```json
{
  "name": "Usuario Teste",
  "email": "usuario_teste@example.com",
  "organization": "Equipe X",
  "role": "fazendeiro",
  "password": "123456"
}
```

### 8.2 Login

`POST /auth/login`

```json
{
  "email": "usuario_teste@example.com",
  "password": "123456"
}
```

Retorno padrão de auth:

- `message`
- `token`
- `user` (`id`, `name`, `email`, `organization`, `role`)

## 9. Seed e predeploy

### 9.1 Seed de dados

```bash
cd api
python scripts/seed.py
```

### 9.2 Predeploy check

```bash
cd api
python scripts/predeploy_check.py --skip-seed
```

Opcional (valida idempotência do seed):

```bash
python scripts/predeploy_check.py --seed-runs 2
```

### 9.3 Estratégia de testes automatizados

A API possui cobertura de testes para autenticação, autorização, serviços de risco, repositórios, ingestão e rotas.

Suites disponíveis em `api/tests`:

- `test_auth.py`: cadastro, login, usuário inativo, bloqueio de admin público e `/auth/me`
- `test_users.py`: listagem/detalhe/atualização administrativa
- `test_reports.py`: criação, listagem, detalhe e moderação
- `test_data_routes.py`: rotas de regiões, risco, focos e clima
- `test_risk_service.py` e `test_risk_hybrid_service.py`: regras de score e classificação
- `test_seed_service.py`: idempotência e carga inicial

Comandos recomendados:

```bash
cd api
pytest -q
pytest --cov=. --cov-report=term-missing
```

Para validação rápida de auth (útil em deploy):

```bash
cd ..
python -m pytest api/tests/test_auth.py -q
```

### 9.4 Garantias do predeploy_check

O script `scripts/predeploy_check.py` executa:

- validação de conectividade com banco e tabelas obrigatórias
- seed opcional com repetição para testar idempotência
- validação de contagem mínima de dados críticos
- smoke test HTTP de endpoints essenciais

## 10. Deploy (Render)

Configuração recomendada do serviço:

- Runtime: Docker
- Root Directory: `api`
- Dockerfile: `Dockerfile`
- Branch de deploy: `backend/api-deploy`

Variáveis mínimas em produção:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_ALGORITHM=HS256`
- `JWT_EXPIRE_MINUTES`
- `CORS_ALLOW_ORIGINS`

Observação importante: `JWT_ALGORITHM` incorreto (ex.: `SH256`) causa falha de autenticação e pode resultar em erro 500.

## 11. Troubleshooting

### 11.1 Login retorna 500 em produção

Checklist:

1. Confirmar `JWT_ALGORITHM=HS256` no Render.
2. Confirmar branch e commit corretos no deploy.
3. Confirmar `DATABASE_URL` do Neon com `sslmode=require`.
4. Verificar roles inválidos em `users` (aceitos: `administrador`, `coordenacao`, `brigadista`, `fazendeiro`).
5. Revisar logs do Render no momento da requisição.

### 11.2 Swagger pedindo username/password

A API usa `BearerAuth` no OpenAPI. Em `Authorize`, cole diretamente o token JWT.

## 12. Status atual do escopo

- API consolidada para autenticação, usuários, risco, focos, clima e reportes.
- Controle de acesso por perfil/permissão ativo.
- Moderação de reportes ativa por permissão.

## 13. Lógica de cálculo de risco

O sistema utiliza uma abordagem híbrida com normalização de variáveis e classificação final por faixa de score.

### 13.1 Score agregado base (focos)

Entrada:

- `quantidade_focos`
- `risco_fogo_mediano`
- `frp_mediano`

Normalização:

- `focos_norm = clamp(quantidade_focos / 50)`
- `risco_fogo_norm = clamp(risco_fogo_mediano)`
- `frp_norm = clamp(frp_mediano / 100)`

Fórmula:

- `score_base = 100 * (0.45*focos_norm + 0.40*risco_fogo_norm + 0.15*frp_norm)`

### 13.2 Score híbrido final

Componentes combinados:

- score de focos (base)
- cicatriz de queimadas (mensal/anual)
- risco de pastagem
- histórico cruzado (pastagem queimada + nível histórico)

Pesos do híbrido:

- 55% focos
- 20% cicatriz
- 15% pastagem
- 10% histórico

Fórmula:

- `score_hibrido = 100 * (0.55*focos + 0.20*cicatriz + 0.15*pastagem + 0.10*historico)`

### 13.3 Classificação e tendência

- `baixo`: score < 35
- `medio`: 35 <= score < 65
- `alto`: score >= 65

Tendência para o dia seguinte:

- `crescente` quando delta > 3
- `decrescente` quando delta < -3
- `estavel` caso contrário

### 13.4 Persistência dos snapshots

Os snapshots de risco são persistidos por `region_id + ano_mes` com upsert idempotente. Em reprocessamento, os registros são atualizados sem duplicação.

## 14. Arquitetura de dados e ingestão

- ingestão principal por `scripts/seed.py`
- estratégia de upsert para evitar duplicidade
- sincronização de datasets: focos, clima, cicatriz, pastagem, risco cruzado e focos georreferenciados
- enriquecimento de região com coordenadas por estado e contexto temporal
