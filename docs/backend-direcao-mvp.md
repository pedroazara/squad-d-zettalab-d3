# Direção Unificada para o Backend MVP

## Objetivo desta direção

Consolidar inconsistências da documentação e definir uma base única para implementacao do backend inicial.

## Deciso~es oficiais para o MVP

1. **Backend:** FastAPI com arquitetura em camadas (`routes`, `services`, `models`).
2. **Persistência:** SQLite local (arquivo `api/app.db`) para acelerar entrega sem travar o time.
3. **Comunicação:** API REST com JSON.
4. **Dados ambientais:** mock inicial por região, com estrutura pronta para evoluir para CSV/API externa.
5. **Cálculo de risco:** score numérico + classificação (`baixo`, `médio`, `alto`) e previsão simples para o dia seguinte.
6. **Autenticação inicial:** cadastro e login com senha hash (PBKDF2), sem fluxo completo de autorização por perfil nesta etapa.

## Inconsistências resolvidas

### Frontend framework
- Documentos antigos citam React.
- Estado real do projeto usa Angular.
- **Resolução:** backend permanece agnóstico de frontend e segue contrato REST; frontend oficial atual e Angular.

### Perfis de usuário
- Existem referências a `brigadista`, `fazendeiro`, `coordenacao` e `administrador`.
- **Resolução:** manter os quatro perfis no contrato para nao perder compatibilidade entre documentos e interface.

### Fórmula do risco
- Ha variações e redundâncias textuais.
- **Resolução:** adotar score normalizado (0-100) com pesos para temperatura, umidade, vento, precipitação e focos de calor.

## Escopo fechado da Sprint Backend Inicial

### Entregas de API

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /regions`
- `GET /risk` (com filtro opcional por regiao)
- `POST /reports/fire`
- `GET /reports/fire`

### Fora do escopo nesta sprint

- Integracao com INPE em tempo real
- Mapa geoespacial persistido
- Notificação por e-mail/SMS
- Controle de autorização por permissão detalhada
- Pipeline de ETL completo

## Proxima evolução recomendada

1. Introduzir migrations (Alembic).
2. Adicionar JWT real e dependência de usuário autenticado.
3. Persistir snapshots ambientais por período.
4. Evoluir `GET /risk` para histórico + previsão multi-dia.
5. Integrar endpoints no `AuthService` e no fluxo de `notificar` do frontend.