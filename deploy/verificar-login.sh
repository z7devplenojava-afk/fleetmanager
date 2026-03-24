#!/bin/bash

# Script rápido para verificar e corrigir erro 500 no login

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔍 Verificando erro 500 no login...${NC}"

# 1. Ver logs recentes
echo -e "${YELLOW}1. Últimos erros do backend:${NC}"
docker compose -f deploy/docker-compose.ci.yml logs --tail=50 backend 2>&1 | grep -i -E "(error|exception|500)" | tail -20 || echo "Nenhum erro encontrado nos logs recentes"

# 2. Verificar saúde
echo -e "\n${YELLOW}2. Saúde do backend:${NC}"
curl -s http://localhost:8081/actuator/health || echo -e "${RED}Backend não está respondendo${NC}"

# 3. Verificar banco
echo -e "\n${YELLOW}3. Testando conexão com banco:${NC}"
docker compose -f deploy/docker-compose.ci.yml exec -T postgres psql -U postgres -d secured_guard_test -c "SELECT 1;" 2>&1 | head -3 || echo -e "${RED}Erro ao conectar no banco${NC}"

# 4. Verificar colunas
echo -e "\n${YELLOW}4. Verificando colunas unified_documents:${NC}"
docker compose -f deploy/docker-compose.ci.yml exec -T postgres psql -U postgres -d secured_guard_test -c "\d unified_documents" 2>&1 | grep -E "(file_name|file_path|unified_file)" || echo "Tabela não existe ou erro"

# 5. Verificar migrations
echo -e "\n${YELLOW}5. Últimas migrations executadas:${NC}"
docker compose -f deploy/docker-compose.ci.yml exec -T postgres psql -U postgres -d secured_guard_test -c "SELECT version, description FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;" 2>&1 | head -10

# 6. Testar endpoint
echo -e "\n${YELLOW}6. Testando endpoint de login:${NC}"
curl -s -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  -w "\nHTTP Status: %{http_code}\n" 2>&1 | tail -5

echo -e "\n${GREEN}✅ Verificação concluída!${NC}"
echo -e "${YELLOW}💡 Para corrigir automaticamente, execute: ./deploy/fix-login-500-error.sh${NC}"

