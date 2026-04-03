# Documento de Arquitetura Tecnologica

## 1. Objetivo desta entrega

Definir o pontape inicial do frontend do projeto Cerrado-Forca com:

- tecnologia base escolhida
- organizacao inicial do codigo
- identidade visual inicial do site
- fluxo demo de cadastro e login para validacao interna

Esta entrega prioriza estrutura, clareza arquitetural e velocidade de evolucao nas proximas sprints.

## 2. Contexto

O projeto pretende apoiar monitoramento e prevencao de incendios no Cerrado por meio de uma plataforma web. Neste momento, o backend ainda esta em fase inicial, por isso o frontend foi desenhado para evoluir de forma desacoplada e sem travar o cronograma.

## 3. Tecnologias escolhidas

### Frontend

- Angular 21.2.5
- TypeScript 5.9
- Angular Router para navegacao
- Reactive Forms para formularios
- RxJS 7.8 para fluxos reativos
- SCSS para tokens, layout e temas
- Vitest como base de testes unitarios

### Backend relacionado

- FastAPI
- Python 3.10+

## 4. Justificativa da escolha do Angular

Angular foi definido como tecnologia oficial do frontend por quatro motivos principais:

1. Estrutura opinativa e escalavel para projetos em equipe.
2. Separacao clara entre `core`, `shared` e `features`.
3. Excelente suporte a formularios, roteamento e organizacao corporativa.
4. Facilidade para evoluir o projeto para dashboards, modulos geoespaciais e areas autenticadas.

### Principios usados

- `core`: servicos e regras transversais
- `shared`: componentes reutilizaveis da interface
- `features`: paginas e fluxos orientados ao dominio
- rotas lazy-loaded para reduzir acoplamento e facilitar crescimento

## 5. Design system inicial

Direcao criativa adotada: **Tactical Prestige / The Guardian's Sentinel**

### Premissas visuais

- paleta escura terrosa inspirada no Cerrado
- azul profundo como base institucional
- laranja de alerta como cor de acao
- superficies em camadas no lugar de divisorias tradicionais

### Tipografia

- `Space Grotesk` para titulos e chamadas
- `Roboto Flex` para textos corridos e labels

### Tokens centrais

- `surface`: base escura da interface
- `surface-container-low/high`: niveis de profundidade
- `primary-container`: azul institucional
- `secondary-container`: laranja de acao
- `outline-ghost`: separacao suave de baixa opacidade

## 8. Estrategia de autenticacao nesta fase

O backend ja possui endpoints de autenticacao (`POST /auth/register` e `POST /auth/login`).
No frontend, ainda foi mantido um fluxo temporario com `localStorage` para acelerar validacao de UI enquanto a integracao HTTP nao e concluida.

### O que isso entrega agora

- validacao visual do fluxo de acesso
- teste de navegacao entre paginas
- preparacao do layout e das regras de formulario
- base pronta para trocar implementacao interna sem refazer a UI

### O que nao e definitivo

- persistencia local nao deve ser usada em producao
- senhas nao estao tratadas com padroes de seguranca reais
- o fluxo existe apenas para aceleracao de desenvolvimento

## 9. Integracao prevista 

### Curto prazo

1. Adicionar configuracao de ambiente para URL da API.
2. Trocar `localStorage` por chamadas HTTP no `AuthService`.
3. Definir contrato de usuario e perfis com backend.
4. Integrar leitura de risco e mapa via `GET /risk` e `GET /fires`.

### Medio prazo

1. Integrar mapa operacional.
2. Criar painel de alertas.
3. Estruturar estado para monitoramento em tempo real.
4. Expandir biblioteca de componentes.

## 10. Como executar o frontend

```bash
cd web
npm install
npm start
```

## 11. Estado atual da decisao arquitetural

Decisao aprovada para a sprint atual:

- **Frontend oficial em Angular**
- **Design system inicial implementado em SCSS**
- **Autenticacao demo como medida temporaria**
- **Estrutura modular preparada para evolucao**
