# 🔧 Correção Rápida - Erro 500 no Login

## Execute na VPS (passo a passo):

### 1. Conectar na VPS
```bash
ssh root@ip-da-vps
cd ~/secured_guard
```

### 2. Ver logs do backend em tempo real
```bash
docker compose -f deploy/docker-compose.ci.yml logs -f backend
```

**Deixe rodando e tente fazer login. Procure por erros em vermelho.**

### 3. Ver últimas 100 linhas de erro
```bash
docker compose -f deploy/docker-compose.ci.yml logs --tail=100 backend | grep -i -E "(error|exception|failed|500)"
```

### 4. Verificar se o backend está rodando
```bash
docker compose -f deploy/docker-compose.ci.yml ps
```

### 5. Verificar saúde do backend
```bash
curl http://localhost:8081/actuator/health
```

### 6. Corrigir colunas unified_documents (se necessário)
```bash
docker compose -f deploy/docker-compose.ci.yml exec postgres psql -U postgres -d secured_guard_test <<EOF
DO \$\$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'unified_documents' AND column_name = 'unified_file_name') THEN
        ALTER TABLE unified_documents RENAME COLUMN unified_file_name TO file_name;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'unified_documents' AND column_name = 'unified_file_path') THEN
        ALTER TABLE unified_documents RENAME COLUMN unified_file_path TO file_path;
    END IF;
END \$\$;
EOF
```

### 7. Executar migrations manualmente (se necessário)
```bash
# Migration V335 (table_details)
docker compose -f deploy/docker-compose.ci.yml exec postgres psql -U postgres -d secured_guard_test -c "ALTER TABLE payslips ADD COLUMN IF NOT EXISTS table_details JSONB;"

# Migration V336 (fix columns)
docker compose -f deploy/docker-compose.ci.yml exec postgres psql -U postgres -d secured_guard_test -c "ALTER TABLE unified_documents RENAME COLUMN unified_file_name TO file_name;" 2>/dev/null || true
docker compose -f deploy/docker-compose.ci.yml exec postgres psql -U postgres -d secured_guard_test -c "ALTER TABLE unified_documents RENAME COLUMN unified_file_path TO file_path;" 2>/dev/null || true
```

### 8. Reiniciar backend
```bash
docker compose -f deploy/docker-compose.ci.yml restart backend
sleep 10
```

### 9. Testar login via curl
```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"seu_usuario","password":"sua_senha"}' \
  -v
```

### 10. Se ainda não funcionar, rebuild completo
```bash
docker compose -f deploy/docker-compose.ci.yml down
docker compose -f deploy/docker-compose.ci.yml up -d --build backend
sleep 20
docker compose -f deploy/docker-compose.ci.yml logs --tail=50 backend
```

## 🔍 Verificar erros específicos:

### Erro de banco de dados:
```bash
docker compose -f deploy/docker-compose.ci.yml exec backend psql -h postgres -U postgres -d secured_guard_test -c "SELECT 1;"
```

### Erro de migrations:
```bash
docker compose -f deploy/docker-compose.ci.yml exec postgres psql -U postgres -d secured_guard_test -c "SELECT version, description, installed_on FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 10;"
```

### Verificar se há usuários:
```bash
docker compose -f deploy/docker-compose.ci.yml exec postgres psql -U postgres -d secured_guard_test -c "SELECT username, email FROM users LIMIT 5;"
```

## 📋 Script Automatizado (Tudo de uma vez):

```bash
cd ~/secured_guard
chmod +x deploy/fix-login-500-error.sh
./deploy/fix-login-500-error.sh
```

