# 🚀 Deploy na VPS - Ambiente CI

## Instruções para fazer deploy na VPS

### Opção 1: Deploy via SSH (Recomendado)

1. **Conectar na VPS via SSH:**
```bash
ssh usuario@ip-da-vps
```

2. **Navegar para o diretório do projeto:**
```bash
cd /opt/secured-guard
```

3. **Atualizar código:**
```bash
git pull origin ci
```

4. **Executar script de deploy:**
```bash
chmod +x deploy-vps-ci.sh
./deploy-vps-ci.sh
```

### Opção 2: Deploy via script local

Se você tem acesso SSH configurado:

```bash
# Do seu computador local
ssh usuario@ip-da-vps "cd /opt/secured-guard && git pull origin ci && chmod +x deploy-vps-ci.sh && ./deploy-vps-ci.sh"
```

### Opção 3: Deploy manual

1. **Conectar na VPS:**
```bash
ssh usuario@ip-da-vps
cd /opt/secured-guard
```

2. **Atualizar código:**
```bash
git pull origin ci
```

3. **Parar serviços:**
```bash
docker compose -f deploy/docker-compose.ci.yml down
```

4. **Rebuild e subir:**
```bash
docker compose -f deploy/docker-compose.ci.yml up -d --build
```

5. **Verificar logs:**
```bash
docker compose -f deploy/docker-compose.ci.yml logs -f backend
```

## ⚠️ Importante sobre o erro 500 no login

O erro 500 no login pode estar relacionado à migration V336 que ainda não foi executada na VPS. 

**Para corrigir:**

1. **Verificar se a migration foi executada:**
```bash
docker compose -f deploy/docker-compose.ci.yml exec backend psql -U postgres -d secured_guard_test -c "\d unified_documents"
```

2. **Se as colunas ainda são `unified_file_name` e `unified_file_path`, executar manualmente:**
```bash
docker compose -f deploy/docker-compose.ci.yml exec postgres psql -U postgres -d secured_guard_test -c "ALTER TABLE unified_documents RENAME COLUMN unified_file_name TO file_name;"
docker compose -f deploy/docker-compose.ci.yml exec postgres psql -U postgres -d secured_guard_test -c "ALTER TABLE unified_documents RENAME COLUMN unified_file_path TO file_path;"
```

3. **Reiniciar o backend:**
```bash
docker compose -f deploy/docker-compose.ci.yml restart backend
```

## 📋 Verificar status

```bash
# Ver status dos containers
docker compose -f deploy/docker-compose.ci.yml ps

# Ver logs do backend
docker compose -f deploy/docker-compose.ci.yml logs -f backend

# Ver logs do frontend
docker compose -f deploy/docker-compose.ci.yml logs -f frontend

# Verificar saúde do backend
curl https://ci.z7botsolutions.com.br/api/actuator/health
```

## 🔍 Troubleshooting

### Erro 500 no login
- Verificar logs do backend: `docker compose -f deploy/docker-compose.ci.yml logs backend | grep -i error`
- Verificar se as migrations foram executadas
- Verificar se o banco de dados está acessível

### Containers não sobem
- Verificar logs: `docker compose -f deploy/docker-compose.ci.yml logs`
- Verificar se há portas em conflito: `netstat -tulpn | grep -E '8081|55432|6380'`
- Verificar espaço em disco: `df -h`

### Frontend não carrega
- Verificar se o build foi feito corretamente
- Verificar logs do nginx: `docker compose -f deploy/docker-compose.ci.yml logs nginx`
- Verificar se o frontend está acessível: `curl https://ci.z7botsolutions.com.br`

