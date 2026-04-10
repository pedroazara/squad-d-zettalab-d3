# GuaraWatch Web

Aplicacao frontend do GuaraWatch para monitoramento historico de queimadas e analise de biodiversidade no Brasil.

## Visao Geral

O projeto oferece dashboards interativos com dados mockados para validacao de produto, navegacao e experiencia analitica. O foco atual e:

- consolidar leituras nacionais e por estado
- acompanhar tendencias historicas de risco
- analisar impactos na biodiversidade
- explorar ocorrencias de fauna com filtros avancados
- correlacionar ocorrencias com camada opcional de queimadas

## Stack

- React 18 + TypeScript
- Vite 5
- Wouter (roteamento)
- Recharts (visualizacoes)
- Tailwind CSS

## Como Rodar

```bash
cd web
npm install
npm start
```

Aplicacao em: `http://localhost:4173`

## Scripts

```bash
npm start
npm run build
npm run test
```

## Principais Rotas

- `/` - Home institucional
- `/login` - Login demo
- `/cadastro` - Cadastro demo
- `/dashboard/nacional` - Painel nacional de queimadas
- `/dashboard/estados` - Analise por estado
- `/dashboard/biodiversidade` - Impacto em especies e grupos taxonomicos
- `/dashboard/tendencias` - Tendencias historicas e padroes
- `/dashboard/ocorrencias` - Nova analise de ocorrencias da fauna
- `/educativo` - Conteudo educativo
- `/educativo/artigo/:id` - Detalhes de artigo
- `/sobre`, `/metodologia`, `/api`, `/contato`, `/perfil`

## O que foi evoluido recentemente

### 1. Granularidade temporal expandida

Os principais dashboards agora suportam:

- Anual
- Mensal
- Diario

Arquivos afetados:

- `src/services/mockData.ts`
- `src/pages/DashboardNacional.tsx`
- `src/pages/DashboardEstados.tsx`
- `src/pages/DashboardTendencias.tsx`

### 2. Nova pagina: Analise de Ocorrencias

Foi adicionada a pagina `dashboard/ocorrencias` com:

- filtros por estado e bioma
- filtro por tipo de animal
- filtro por raca/subespecie
- busca textual por especie/comportamento
- serie temporal anual/mensal/diaria
- distribuicao comportamental
- ranking por raca
- distribuicao por regiao
- camada opcional de queimadas com:
  - overlay no mapa
  - metricas complementares
  - grafico de correlacao comportamento x intensidade de fogo

Arquivos principais:

- `src/pages/DashboardOcorrencias.tsx`
- `src/services/mockData.ts`
- `src/App.tsx`
- `src/components/Navbar.tsx`

### 3. Painel Nacional com dashboards adicionais

No painel nacional foram adicionados novos blocos analiticos:

- Relacao entre score de risco e focos de calor (top estados)
- Area queimada estimada por bioma em valores absolutos (M ha)

Arquivo:

- `src/pages/DashboardNacional.tsx`

## Estrutura de Pastas (resumo)

```text
src/
  components/
    ui/
  contexts/
  hooks/
  lib/
  pages/
  services/
```

## Dados e Escopo Atual

- Os dados atuais sao mockados e mantidos em `src/services/mockData.ts`.
- O projeto esta preparado para evolucao com dados reais e integracao backend.

## Validacao Recomendada

1. Rodar `npm run build`.
2. Validar navegacao entre dashboards no desktop e mobile.
3. Validar alternancia anual/mensal/diaria nos paineis.
4. Validar filtros e camada de queimadas em `dashboard/ocorrencias`.
