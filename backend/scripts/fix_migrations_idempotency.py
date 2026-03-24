#!/usr/bin/env python3
"""
Script para tornar migrations idempotentes, adicionando IF NOT EXISTS
e verificações apropriadas para CREATE TABLE, CREATE INDEX, etc.
"""

import os
import re
from pathlib import Path

MIGRATION_DIR = Path(__file__).parent.parent / "src" / "main" / "resources" / "db" / "migration"

def is_idempotent(content: str) -> bool:
    """Verifica se a migration já é idempotente"""
    # Verifica se usa DO blocks com IF NOT EXISTS
    if "DO $$" in content and "IF NOT EXISTS" in content:
        return True
    # Verifica se usa CREATE TABLE IF NOT EXISTS
    if re.search(r'CREATE TABLE\s+IF NOT EXISTS', content, re.IGNORECASE):
        return True
    # Verifica se todos os CREATE TABLE estão em DO blocks
    create_table_lines = re.findall(r'^CREATE TABLE\s+(\w+)', content, re.MULTILINE | re.IGNORECASE)
    if not create_table_lines:
        return True  # Não tem CREATE TABLE, então está OK
    return False

def find_non_idempotent_migrations():
    """Encontra todas as migrations que não são idempotentes"""
    non_idempotent = []
    for sql_file in sorted(MIGRATION_DIR.glob("V*.sql")):
        try:
            content = sql_file.read_text(encoding='utf-8')
            if not is_idempotent(content) and "CREATE TABLE" in content:
                # Conta quantos CREATE TABLE sem IF NOT EXISTS existem
                create_table_count = len(re.findall(r'^CREATE TABLE\s+(?!IF NOT EXISTS)(\w+)', content, re.MULTILINE | re.IGNORECASE))
                if create_table_count > 0:
                    non_idempotent.append((sql_file.name, create_table_count))
        except Exception as e:
            print(f"Erro ao processar {sql_file.name}: {e}")
    return non_idempotent

if __name__ == "__main__":
    print("🔍 Procurando migrations não idempotentes...\n")
    non_idempotent = find_non_idempotent_migrations()
    
    if non_idempotent:
        print(f"❌ Encontradas {len(non_idempotent)} migrations não idempotentes:\n")
        for filename, count in non_idempotent:
            print(f"  - {filename} ({count} CREATE TABLE sem IF NOT EXISTS)")
    else:
        print("✅ Todas as migrations já são idempotentes!")
