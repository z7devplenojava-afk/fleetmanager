#!/bin/bash

# =====================================================
# Script para gerar INSERTs hardcoded do banco secured_guard_test
# e atualizar automaticamente a migration V999
# =====================================================

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DB_NAME="secured_guard_test"
DB_USER="${DB_USER:-postgressg}"
DB_PASSWORD="${DB_PASSWORD:-4KaCiJc6an@7sgbdcid2025}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

MIGRATION_FILE="backend/src/main/resources/db/migration-ci/V999__seed_ci_essential_data.sql"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../../.." && pwd)"

echo -e "${GREEN}🚀 Gerando INSERTs hardcoded do banco ${DB_NAME}${NC}"
echo "=========================================="
echo ""

# Verificar conexão
echo -e "${YELLOW}📋 Verificando conexão...${NC}"
export PGPASSWORD="$DB_PASSWORD"
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\q" 2>/dev/null; then
    echo -e "${RED}❌ Erro: Não foi possível conectar ao banco${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Conectado${NC}"
echo ""

# Criar diretório temporário
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Exportar usuários
echo -e "${YELLOW}📤 Exportando usuários...${NC}"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -f "$SCRIPT_DIR/export_users_from_test_db.sql" \
    -t -A > "$TEMP_DIR/users_export.sql" 2>/dev/null

grep "INSERT INTO users" "$TEMP_DIR/users_export.sql" > "$TEMP_DIR/users_only.sql" || true
grep "INSERT INTO user_roles" "$TEMP_DIR/users_export.sql" > "$TEMP_DIR/user_roles_only.sql" || true

USER_COUNT=$(wc -l < "$TEMP_DIR/users_only.sql" | tr -d ' ')
ROLE_COUNT=$(wc -l < "$TEMP_DIR/user_roles_only.sql" | tr -d ' ')

echo -e "${GREEN}✅ ${USER_COUNT} usuários e ${ROLE_COUNT} user_roles${NC}"

# Exportar funcionários
echo -e "${YELLOW}📤 Exportando funcionários...${NC}"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -f "$SCRIPT_DIR/export_employees_from_test_db.sql" \
    -t -A > "$TEMP_DIR/employees_export.sql" 2>/dev/null

EMPLOYEE_COUNT=$(grep -c "INSERT INTO employees" "$TEMP_DIR/employees_export.sql" 2>/dev/null || echo "0")
echo -e "${GREEN}✅ ${EMPLOYEE_COUNT} funcionários${NC}"
echo ""

# Atualizar migration usando Python
MIGRATION_PATH="$PROJECT_ROOT/$MIGRATION_FILE"
if [ ! -f "$MIGRATION_PATH" ]; then
    echo -e "${RED}❌ Migration não encontrada${NC}"
    exit 1
fi

echo -e "${YELLOW}📝 Atualizando migration...${NC}"

python3 << EOF
import re

with open("$MIGRATION_PATH", "r", encoding="utf-8") as f:
    content = f.read()

# Ler dados
with open("$TEMP_DIR/users_only.sql", "r", encoding="utf-8") as f:
    users_data = f.read().strip()

with open("$TEMP_DIR/user_roles_only.sql", "r", encoding="utf-8") as f:
    roles_data = f.read().strip()

with open("$TEMP_DIR/employees_export.sql", "r", encoding="utf-8") as f:
    employees_data = f.read().strip()

# Atualizar seção 7.1.1 (usuários fallback)
pattern1 = r'(-- =====================================================\s*-- 7\.1\.1\. INSERTs HARDCODED DE USUÁRIOS.*?-- COLE OS INSERTs DE USUÁRIOS AQUI.*?\n)'
if users_data:
    replacement1 = r'\1' + users_data + '\n\n'
    content = re.sub(pattern1, replacement1, content, flags=re.DOTALL)

# Atualizar seção 7.2 (user_roles fallback)
pattern2 = r'(-- =====================================================\s*-- 7\.2\. USER_ROLES DOS USUÁRIOS.*?-- COLE OS INSERTs DE USER_ROLES AQUI.*?\n)'
if roles_data:
    replacement2 = r'\1' + roles_data + '\n\n'
    content = re.sub(pattern2, replacement2, content, flags=re.DOTALL)

# Atualizar seção 8.1 (funcionários fallback)
pattern3 = r'(-- =====================================================\s*-- 8\.1\. INSERTs HARDCODED DE FUNCIONÁRIOS.*?-- COLE OS INSERTs DE FUNCIONÁRIOS AQUI.*?\n)'
if employees_data:
    replacement3 = r'\1' + employees_data + '\n\n'
    content = re.sub(pattern3, replacement3, content, flags=re.DOTALL)

with open("$MIGRATION_PATH", "w", encoding="utf-8") as f:
    f.write(content)
EOF

echo -e "${GREEN}✅ Migration atualizada!${NC}"
echo ""
echo -e "${YELLOW}📊 Resumo:${NC}"
echo "   - Usuários: ${USER_COUNT}"
echo "   - User_roles: ${ROLE_COUNT}"
echo "   - Funcionários: ${EMPLOYEE_COUNT}"
echo ""
echo -e "${GREEN}✨ Pronto! A migration V999 agora contém os INSERTs hardcoded como fallback.${NC}"

