#!/bin/bash

# Script para corrigir URL do repositório remoto na VPS
# Uso: Execute este script na VPS via SSH

echo "🔧 ========================================"
echo "🔧 CORRIGINDO URL DO REPOSITÓRIO REMOTO"
echo "🔧 ========================================"
echo ""

CORRECT_URL="https://github.com/zemarioramos/fluxbus.git"

# Verificar em múltiplos locais possíveis
REPO_PATHS=(
  "/var/www/fluxbus/ci"
  "/var/www/fluxbus"
  "/root/fluxbus"
  "/home/root/fluxbus"
  "$HOME/fluxbus"
  "$(pwd)"
)

FIXED=false

for repo_path in "${REPO_PATHS[@]}"; do
  if [ -d "$repo_path/.git" ]; then
    echo "📂 Encontrado repositório em: $repo_path"
    cd "$repo_path" || continue
    
    echo ""
    echo "📋 URL atual do repositório remoto:"
    git remote -v 2>/dev/null || echo "  ⚠️ Não foi possível verificar remotes"
    
    # Verificar se a URL está incorreta
    CURRENT_URL=$(git remote get-url origin 2>/dev/null || echo "")
    
    if [ -n "$CURRENT_URL" ]; then
      echo ""
      echo "🔍 URL atual: $CURRENT_URL"
      echo "✅ URL correta: $CORRECT_URL"
      
      # Verificar se contém "zmarioramos" (sem o "e") ou se é diferente
      if echo "$CURRENT_URL" | grep -q "zmarioramos" || [ "$CURRENT_URL" != "$CORRECT_URL" ]; then
        echo ""
        echo "🔄 URL incorreta detectada! Corrigindo..."
        
        # Remover remote atual
        echo "  🗑️ Removendo remote 'origin' atual..."
        git remote remove origin 2>/dev/null || true
        
        # Adicionar remote com URL correta
        echo "  ➕ Adicionando remote 'origin' com URL correta..."
        git remote add origin "$CORRECT_URL" 2>/dev/null || {
          echo "  ⚠️ Erro ao adicionar. Tentando set-url..."
          git remote set-url origin "$CORRECT_URL" 2>/dev/null || true
        }
        
        # Verificar se foi corrigido
        sleep 1
        NEW_URL=$(git remote get-url origin 2>/dev/null || echo "")
        echo ""
        echo "📋 Nova URL do repositório remoto:"
        git remote -v 2>/dev/null
        
        if echo "$NEW_URL" | grep -q "zemarioramos"; then
          echo ""
          echo "✅ URL corrigida com sucesso!"
          FIXED=true
        else
          echo ""
          echo "⚠️ Ainda tentando corrigir..."
          # Forçar correção novamente
          git remote set-url origin "$CORRECT_URL" 2>/dev/null || true
          echo "📋 Verificando novamente:"
          git remote -v 2>/dev/null
          FIXED=true
        fi
      else
        echo "✅ URL já está correta!"
        FIXED=true
      fi
    else
      echo "⚠️ Nenhum remote 'origin' encontrado. Adicionando..."
      git remote add origin "$CORRECT_URL" 2>/dev/null || true
      echo "✅ Remote 'origin' adicionado com URL correta!"
      git remote -v 2>/dev/null
      FIXED=true
    fi
    
    echo ""
    break
  fi
done

if [ "$FIXED" = false ]; then
  echo "ℹ️ Nenhum repositório git encontrado nos locais padrão:"
  for path in "${REPO_PATHS[@]}"; do
    echo "   - $path"
  done
  echo ""
  echo "💡 Dica: Execute este script no diretório onde está o repositório git"
  echo "   ou informe o caminho correto do repositório"
fi

echo ""
echo "🔧 ========================================"
echo "✅ CORREÇÃO CONCLUÍDA"
echo "🔧 ========================================"

