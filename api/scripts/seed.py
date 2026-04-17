#!/usr/bin/env python
"""
Script standalone para ingestão de dados no banco de dados.

Uso:
    python scripts/seed.py

Isso executa as 3 sincronizações (focos, clima, risco) e cria usuários default.
A ingestão é idempotente, pode ser executada múltiplas vezes sem problemas.
"""
import sys
from pathlib import Path

# Adicionar o diretório pai ao path para imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from db import Base, SessionLocal, engine
from services.seed_service import ensure_seed_data


def main():
    """Executa a ingestão de dados."""
    print("🌱 Iniciando seed de dados...")

    # Garante criação das tabelas antes da carga inicial/recarga.
    Base.metadata.create_all(bind=engine)
    
    with SessionLocal() as db:
        ensure_seed_data(db)
    
    print("✅ Seed concluído com sucesso!")


if __name__ == "__main__":
    main()
