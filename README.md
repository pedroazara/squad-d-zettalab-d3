# Cerrado-Força — Squad D | Zetta Lab 2025

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

## Squad

| Membro | Trilha |
|---|---|
| Pedro Henrique | Gestão de Projetos |
| João Guilherme | Desenvolvimento de Software |
| Kauê | Desenvolvimento de Software |
| Luíza | Geotecnologia |
| João Vitor | Ciência e Governânça de Dados |
| Michelle | Comunicação e Marketing |
