# 🔧 Soluções para Resolver Loop da Evolution API

## 🔍 Diagnóstico

Execute primeiro:
```bash
chmod +x diagnosticar-evolution-ci.sh
./diagnosticar-evolution-ci.sh
```

---

## ✅ **SOLUÇÃO 1: Desabilitar Redis (usar cache local)**

O loop pode ser causado pelo Redis. Vamos desabilitar:

### Editar `docker-compose.ci.yml`:

```yaml
evolution-api-ci:
  environment:
    # ... outras configs ...
    
    # Cache (DESABILITAR Redis)
    - CACHE_REDIS_ENABLED=false
    - CACHE_LOCAL_ENABLED=true  # ← Mudar para true
```

### Deploy:
```bash
ssh root@ci.z7botsolutions.com.br
cd /var/www/secured_guard/ci
git pull origin ci
docker-compose -f docker-compose.ci.yml up -d --force-recreate evolution-api-ci
```

---

## ✅ **SOLUÇÃO 2: Desabilitar Banco (usar filesystem)**

Se o Redis não resolver, pode ser o PostgreSQL:

### Editar `docker-compose.ci.yml`:

```yaml
evolution-api-ci:
  environment:
    # ... outras configs ...
    
    # Database (DESABILITAR)
    - DATABASE_ENABLED=false
    
    # Cache (usar local)
    - CACHE_REDIS_ENABLED=false
    - CACHE_LOCAL_ENABLED=true
```

### Deploy:
```bash
ssh root@ci.z7botsolutions.com.br
cd /var/www/secured_guard/ci
docker-compose -f docker-compose.ci.yml up -d --force-recreate evolution-api-ci
```

---

## ✅ **SOLUÇÃO 3: Configuração Mínima (100% filesystem)**

Configuração mais simples possível:

### Editar `docker-compose.ci.yml`:

```yaml
evolution-api-ci:
  image: atendai/evolution-api:v2.1.0
  container_name: evolution-api-ci
  ports:
    - "9000:8080"
  environment:
    # URLs
    - SERVER_URL=http://185.225.233.18:8080
    
    # Autenticação
    - AUTHENTICATION_TYPE=apikey
    - AUTHENTICATION_API_KEY=B6D711FCDE4D4FD5936544120E713976
    
    # Sessão
    - CONFIG_SESSION_PHONE_CLIENT=SecuredGuard
    - CONFIG_SESSION_PHONE_NAME=chrome
    
    # QR Code
    - QRCODE_LIMIT=30
    
    # DESABILITAR TUDO
    - DATABASE_ENABLED=false
    - CACHE_REDIS_ENABLED=false
    - CACHE_LOCAL_ENABLED=false
    - TYPEBOT_ENABLED=false
    - CHATWOOT_ENABLED=false
    - RABBITMQ_ENABLED=false
    - WEBHOOK_GLOBAL_ENABLED=false
    
    # Logs
    - LOG_LEVEL=DEBUG
  volumes:
    - /var/www/secured_guard/ci/evolution_instances:/evolution/instances
  restart: unless-stopped
```

---

## ✅ **SOLUÇÃO 4: Trocar versão da Evolution API**

Testar versão anterior mais estável:

### Editar `docker-compose.ci.yml`:

```yaml
evolution-api-ci:
  image: atendai/evolution-api:v2.0.0  # ← Versão anterior
```

Ou versão latest:

```yaml
evolution-api-ci:
  image: atendai/evolution-api:latest
```

---

## ✅ **SOLUÇÃO 5: Deletar instância e recriar**

Se não houver loop mas QR Code estiver vazio:

```bash
# Deletar instância
curl -X DELETE -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  http://185.225.233.18:9000/instance/delete/securedguard

# Aguardar 5 segundos
sleep 5

# Recriar
curl -X POST http://185.225.233.18:9000/instance/create \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  -H "Content-Type: application/json" \
  -d '{"instanceName":"securedguard","integration":"WHATSAPP-BAILEYS"}'

# Aguardar 15 segundos
sleep 15

# Obter QR Code
curl -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  http://185.225.233.18:9000/instance/connect/securedguard
```

---

## ✅ **SOLUÇÃO 6: Limpar volumes e reiniciar**

```bash
ssh root@ci.z7botsolutions.com.br

# Parar Evolution
docker-compose -f /var/www/secured_guard/ci/docker-compose.ci.yml down evolution-api-ci

# Limpar volumes
rm -rf /var/www/secured_guard/ci/evolution_instances/*

# Limpar dados do banco (se habilitado)
docker exec secured-guard-db-ci psql -U secured_guard_ci -c "DROP DATABASE IF EXISTS evolution_ci;"
docker exec secured-guard-db-ci psql -U secured_guard_ci -c "CREATE DATABASE evolution_ci;"

# Reiniciar
docker-compose -f /var/www/secured_guard/ci/docker-compose.ci.yml up -d evolution-api-ci
```

---

## 📋 Ordem de Teste Recomendada

### **Teste 1: Diagnóstico**
```bash
./diagnosticar-evolution-ci.sh
```

### **Teste 2: Solução 1** (mais provável)
Desabilitar Redis → usar cache local

### **Teste 3: Solução 3** (se Teste 2 não funcionar)
Configuração mínima (sem banco, sem cache)

### **Teste 4: Solução 5** (se não houver loop)
Deletar e recriar instância

### **Teste 5: Solução 6** (última tentativa)
Limpar tudo e reiniciar do zero

---

## 🎯 Objetivo

**Fazer Evolution API gerar QR Code sem loop!**

Vamos testar as soluções uma por uma até encontrar a que funciona.

**Por qual solução você quer começar?**

