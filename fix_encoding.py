#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para corrigir problemas de encoding no frontend
"""

import os
import sys
from pathlib import Path

# Mapeamento de caracteres corrompidos para corretos
REPLACEMENTS = {
    'Ol!': 'Olá!',
    'est': 'está',
    'disponvel': 'disponível',
    'dvidas': 'dúvidas',
    'unio': 'união',
    'Funo': 'Função',
    'unificao': 'unificação',
    'Validao': 'Validação',
    'Visualizao': 'Visualização',
    'excluso': 'exclusão',
    'no h': 'não há',
    'no usar': 'não usar',
    'resultado': 'resultado à',
}

def fix_file(file_path):
    """Corrige encoding de um arquivo"""
    try:
        # Ler arquivo com diferentes encodings
        content = None
        for encoding in ['utf-8', 'latin-1', 'cp1252']:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    content = f.read()
                break
            except UnicodeDecodeError:
                continue
        
        if content is None:
            print(f"❌ Não foi possível ler {file_path}")
            return False
        
        original_content = content
        
        # Aplicar substituições
        for old, new in REPLACEMENTS.items():
            if old in content:
                content = content.replace(old, new)
        
        # Salvar apenas se houver mudanças
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Corrigido: {file_path}")
            return True
        else:
            print(f"⏭️  OK: {file_path}")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao processar {file_path}: {e}")
        return False

def main():
    # Arquivo específico para corrigir
    file_path = Path('frontend/src/pages/Holerites.tsx')
    
    if not file_path.exists():
        print(f"❌ Arquivo não encontrado: {file_path}")
        sys.exit(1)
    
    print(f"🔧 Corrigindo encoding de {file_path}...")
    fix_file(file_path)
    print("✅ Concluído!")

if __name__ == '__main__':
    main()

