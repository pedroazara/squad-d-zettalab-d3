# Cerrado-Forca Web

Frontend inicial do projeto Cerrado-Forca, construido em Angular para servir como base visual, estrutural e arquitetural das proximas sprints.

## Stack definida

- Angular 21.2.5
- TypeScript 5.9
- Angular Router
- Reactive Forms
- SCSS com design tokens globais
- Vitest para testes unitarios

## Como rodar

```bash
cd web
npm install
npm start
```

Aplicacao disponivel em `http://localhost:4200`.

## Scripts uteis

```bash
npm start
npm run build
npm test -- --watch=false
```

## Estrutura de pastas

```text
src/app/
  core/
    auth/          # servico, guard e modelos de autenticacao demo
  features/
    auth/          # paginas de login e cadastro
    dashboard/     # painel inicial protegido
    home/          # landing page principal
  shared/
    components/    # header e footer reutilizaveis
```

## Rotas iniciais

- `/` - landing page institucional do projeto
- `/sobre` - manifesto, conceito e diretrizes da alianca
- `/prevencao` - boas praticas e checklist de prontidao
- `/fauna` - resgate, cuidado e impacto do fogo na biodiversidade
- `/participar` - caminhos de adesao para produtores, voluntarios e apoiadores
- `/emergencia` - denuncia de incendio em fluxo demo
- `/login` - acesso demo local
- `/cadastro` - cadastro demo local
- `/painel` - area protegida por guard

As seis paginas publicas acima foram adaptadas dos prototipos HTML da pasta `stitch_participar_cerrado_for_a`.

## Fluxo de autenticacao atual

Nesta entrega o login e cadastro funcionam em modo demo com `localStorage`. Isso foi escolhido para:

- permitir demonstracao do fluxo ja nesta semana
- evitar acoplamento prematuro com um backend ainda em fase inicial
- preparar a interface para a futura integracao com a API FastAPI

## Credenciais demo para login

Voce pode entrar sem cadastrar nada usando um destes acessos mockados:

- Coordenacao: `comando@cerradoforca.org` / `cerrado123`
- Brigadista: `brigada@cerradoforca.org` / `brigada123`

Se quiser testar um fluxo novo, a tela `/cadastro` continua criando usuarios locais no navegador.

## Design system

A interface segue a direcao visual "The Guardian's Sentinel" com refinamento inspirado em Material
Design 3:

- paleta azul-profundo com acentos quentes e superficies tonais
- combinacao tipografica `Space Grotesk` + `Roboto Flex`
- superficies elevadas e estados visuais mais proximos do ecossistema Google
- CTA com profundidade tonal e foco forte em legibilidade

Os tokens globais ficam em [src/styles.scss](/home/zetta/Área%20de%20trabalho/zettalab/squad-d-zettalab-d3/web/src/styles.scss).

## Proximos passos sugeridos

1. Integrar autenticacao real com FastAPI.
2. Adicionar environments para `apiBaseUrl`.
3. Criar modulo de mapa operacional e painel de alertas.
4. Expandir componentes reutilizaveis do design system.
