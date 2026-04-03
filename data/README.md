# Dados do Projeto

Este diretório organiza os datasets usados no backend e nas análises.

## Estrutura

- `raw/`: dados de entrada sem transformação.
- `external/`: dados de fontes externas e metadados de referência.
- `interim/`: dados intermediários e pesados usados para derivação.
- `processed/`: dados finais prontos para consumo da API e dashboard.
- `notebooks/`: exploração e validações analíticas.

## Regras de versionamento

- Arquivos de `interim/` não devem ser rastreados no Git.
- Em `processed/`, versionar apenas datasets leves e necessários para reprodução.
- Datasets grandes devem ficar em armazenamento local/compartilhado e ser documentados.

## Convencoes de nome

- Usar minusculas e underscore.
- Evitar espaços e acentos em nomes de arquivo.
- Nome recomendado: `fonte_tema_granularidade_periodo.csv`.

## Fluxo recomendado

1. Ingerir dados em `raw/` ou `external/`.
2. Transformar e limpar em `interim/`.
3. Publicar recortes finais em `processed/`.
4. Consumir `processed/` no backend.
