#!/bin/bash

# =====================================================
# Script para exportar dados do banco secured_guard_test
# e atualizar automaticamente a migration de CI
# =====================================================

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configurações
DB_NAME="secured_guard_test"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
MIGRATION_FILE="backend/src/main/resources/db/migration-ci/V999__seed_ci_essential_data.sql"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../../.." && pwd)"

echo -e "${GREEN}🚀 Exportando dados do banco ${DB_NAME} para migration de CI${NC}"
echo "=========================================="
echo ""

# Verificar se psql está disponível
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ Erro: psql não encontrado. Instale o PostgreSQL client.${NC}"
    exit 1
fi

# Verificar conexão com o banco
echo -e "${YELLOW}📋 Verificando conexão com o banco ${DB_NAME}...${NC}"
if ! PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\q" 2>/dev/null; then
    echo -e "${RED}❌ Erro: Não foi possível conectar ao banco ${DB_NAME}${NC}"
    echo "   Verifique as credenciais: DB_USER, DB_PASSWORD, DB_HOST, DB_PORT"
    exit 1
fi
echo -e "${GREEN}✅ Conexão estabelecida${NC}"
echo ""

# Criar diretório temporário para os exports
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo -e "${YELLOW}📤 Exportando usuários...${NC}"
PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -f "$SCRIPT_DIR/export_users_from_test_db.sql" \
    -o "$TEMP_DIR/users_export.sql" \
    -t -A 2>/dev/null || true

# Separar usuários e user_roles
grep "INSERT INTO users" "$TEMP_DIR/users_export.sql" > "$TEMP_DIR/users_only.sql" || true
grep "INSERT INTO user_roles" "$TEMP_DIR/users_export.sql" > "$TEMP_DIR/user_roles_only.sql" || true

USER_COUNT=$(wc -l < "$TEMP_DIR/users_only.sql" | tr -d ' ')
ROLE_COUNT=$(wc -l < "$TEMP_DIR/user_roles_only.sql" | tr -d ' ')

echo -e "${GREEN}✅ Exportados ${USER_COUNT} usuários e ${ROLE_COUNT} relacionamentos user_roles${NC}"
echo ""

echo -e "${YELLOW}📤 Exportando funcionários...${NC}"
PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -f "$SCRIPT_DIR/export_employees_from_test_db.sql" \
    -o "$TEMP_DIR/employees_export.sql" \
    -t -A 2>/dev/null || true

EMPLOYEE_COUNT=$(grep -c "INSERT INTO employees" "$TEMP_DIR/employees_export.sql" 2>/dev/null || echo "0")
echo -e "${GREEN}✅ Exportados ${EMPLOYEE_COUNT} funcionários${NC}"
echo ""

# Verificar se a migration existe
MIGRATION_PATH="$PROJECT_ROOT/$MIGRATION_FILE"
if [ ! -f "$MIGRATION_PATH" ]; then
    echo -e "${RED}❌ Erro: Migration não encontrada em $MIGRATION_PATH${NC}"
    exit 1
fi

echo -e "${YELLOW}📝 Atualizando migration...${NC}"

# Criar backup da migration
BACKUP_FILE="${MIGRATION_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$MIGRATION_PATH" "$BACKUP_FILE"
echo -e "${GREEN}✅ Backup criado: $(basename $BACKUP_FILE)${NC}"

# Função para inserir dados entre marcadores
insert_between_markers() {
    local file="$1"
    local start_marker="$2"
    local end_marker="$3"
    local data_file="$4"
    
    # Encontrar linha de início
    local start_line=$(grep -n "$start_marker" "$file" | head -1 | cut -d: -f1)
    if [ -z "$start_line" ]; then
        echo -e "${RED}❌ Marcador não encontrado: $start_marker${NC}"
        return 1
    fi
    
    # Encontrar linha de fim
    local end_line=$(sed -n "${start_line},\$p" "$file" | grep -n "$end_marker" | head -1 | cut -d: -f1)
    if [ -z "$end_line" ]; then
        echo -e "${RED}❌ Marcador não encontrado: $end_marker${NC}"
        return 1
    fi
    end_line=$((start_line + end_line - 1))
    
    # Criar arquivo temporário
    local temp_file=$(mktemp)
    
    # Copiar até a linha de início
    sed -n "1,${start_line}p" "$file" > "$temp_file"
    
    # Adicionar dados se existirem
    if [ -s "$data_file" ]; then
        echo "" >> "$temp_file"
        cat "$data_file" >> "$temp_file"
        echo "" >> "$temp_file"
    fi
    
    # Copiar do final até o fim
    sed -n "${end_line},\$p" "$file" >> "$temp_file"
    
    # Substituir arquivo original
    mv "$temp_file" "$file"
}

# Atualizar seção de usuários
if [ -s "$TEMP_DIR/users_only.sql" ]; then
    echo -e "${YELLOW}   → Inserindo usuários na seção 7.1...${NC}"
    # Encontrar e substituir a seção de usuários
    python3 << EOF
import re

with open("$MIGRATION_PATH", "r", encoding="utf-8") as f:
    content = f.read()

# Ler dados de usuários
with open("$TEMP_DIR/users_only.sql", "r", encoding="utf-8") as f:
    users_data = f.read().strip()

# Padrão para encontrar a seção 7.1
pattern = r'(-- =====================================================\s*-- 7\.1\. USUÁRIOS DO BANCO secured_guard_test.*?-- COLE OS INSERTs DE USUÁRIOS EXPORTADOS AQUI ABAIXO:.*?\n)'

if users_data:
    replacement = r'\1' + users_data + '\n\n'
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open("$MIGRATION_PATH", "w", encoding="utf-8") as f:
    f.write(content)
EOF
    echo -e "${GREEN}   ✅ Usuários inseridos${NC}"
else
    echo -e "${YELLOW}   ⚠️  Nenhum usuário para inserir${NC}"
fi

# Atualizar seção de user_roles
if [ -s "$TEMP_DIR/user_roles_only.sql" ]; then
    echo -e "${YELLOW}   → Inserindo user_roles na seção 7.2...${NC}"
    python3 << EOF
import re

with open("$MIGRATION_PATH", "r", encoding="utf-8") as f:
    content = f.read()

# Ler dados de user_roles
with open("$TEMP_DIR/user_roles_only.sql", "r", encoding="utf-8") as f:
    roles_data = f.read().strip()

# Padrão para encontrar a seção 7.2
pattern = r'(-- =====================================================\s*-- 7\.2\. USER_ROLES DOS USUÁRIOS DO BANCO secured_guard_test.*?-- COLE OS INSERTs DE USER_ROLES EXPORTADOS AQUI ABAIXO:.*?\n)'

if roles_data:
    replacement = r'\1' + roles_data + '\n\n'
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open("$MIGRATION_PATH", "w", encoding="utf-8") as f:
    f.write(content)
EOF
    echo -e "${GREEN}   ✅ User_roles inseridos${NC}"
else
    echo -e "${YELLOW}   ⚠️  Nenhum user_role para inserir${NC}"
fi

# Atualizar seção de funcionários
if [ -s "$TEMP_DIR/employees_export.sql" ]; then
    echo -e "${YELLOW}   → Inserindo funcionários na seção 8...${NC}"
    python3 << EOF
import re

with open("$MIGRATION_PATH", "r", encoding="utf-8") as f:
    content = f.read()

# Ler dados de funcionários
with open("$TEMP_DIR/employees_export.sql", "r", encoding="utf-8") as f:
    employees_data = f.read().strip()

# Padrão para encontrar a seção 8
pattern = r'(-- =====================================================\s*-- 8\. FUNCIONÁRIOS DO BANCO secured_guard_test.*?-- COLE OS INSERTs DE FUNCIONÁRIOS EXPORTADOS AQUI ABAIXO:.*?\n)'

if employees_data:
    replacement = r'\1' + employees_data + '\n\n'
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open("$MIGRATION_PATH", "w", encoding="utf-8") as f:
    f.write(content)
EOF
    echo -e "${GREEN}   ✅ Funcionários inseridos${NC}"
else
    echo -e "${YELLOW}   ⚠️  Nenhum funcionário para inserir${NC}"
fi

echo ""
echo -e "${GREEN}✅ Migration atualizada com sucesso!${NC}"
echo ""
echo -e "${YELLOW}📊 Resumo:${NC}"
echo "   - Usuários: ${USER_COUNT}"
echo "   - User_roles: ${ROLE_COUNT}"
echo "   - Funcionários: ${EMPLOYEE_COUNT}"
echo ""
echo -e "${YELLOW}📋 Próximos passos:${NC}"
echo "   1. Revise a migration atualizada: $MIGRATION_FILE"
echo "   2. Valide a sintaxe SQL se necessário"
echo "   3. Faça commit e push das alterações"
echo "   4. O próximo deploy do CI executará a migration automaticamente"
echo ""
echo -e "${GREEN}✨ Processo concluído!${NC}"

