# 🚨 CORREÇÃO URGENTE: Error 405 no CI

## 📋 **PROBLEMA IDENTIFICADO**

**Erro:** `405 Not Allowed` em `/auth/login`  
**Causa:** Traefik possivelmente bloqueando método POST ou CORS preflight  
**Ambiente:** CI (ci.z7botsolutions.com.br)

---

## ✅ **CORREÇÃO APLICADA**

### Arquivo: `docker-compose.ci.yml`

**Mudança:**
- ✅ Adicionada prioridade ao router
- ✅ CORS já configurado (mantido)
- ✅ Métodos HTTP permitidos (mantido)

---

## 🚀 **DEPLOY PARA CI**

### **Opção A: GitHub Actions (RECOMENDADO)**

```bash
cd C:\dev\secured-guard

git add docker-compose.ci.yml
git commit -m "fix: adiciona prioridade ao router Traefik para corrigir 405"
git push origin ci
```

**Aguarde ~5 minutos para deploy automático**

---

### **Opção B: Manual no Servidor (RÁPIDO)**

**Se tiver acesso SSH ao servidor CI:**

```bash
# 1. Conectar ao servidor
ssh usuario@ci.z7botsolutions.com.br

# 2. Ir para diretório do projeto
cd /var/www/secured-guard  # ou caminho correto

# 3. Pull das mudanças
git pull origin ci

# 4. Recriar backend com novo Traefik config
docker-compose -f docker-compose.ci.yml up -d --force-recreate backend-ci

# 5. Verificar logs
docker logs backend-ci --tail 50

# 6. Testar login
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"jose.ramos","password":"123456"}'
```

---

## 🔍 **VERIFICAR SE FUNCIONOU**

### **1. Verificar backend rodando:**
```bash
curl https://ci.z7botsolutions.com.br/api/health
```

**Esperado:** `200 OK`

### **2. Testar login:**
```bash
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"teste","password":"123"}'
```

**Esperado:** `200 OK` ou `401 Unauthorized` (NÃO 405!)

### **3. Testar OPTIONS (CORS preflight):**
```bash
curl -X OPTIONS https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Origin: https://ci.z7botsolutions.com.br" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

**Esperado:** Headers CORS presentes

---

## 🔧 **SE AINDA DER 405**

### **Verificar Traefik:**

```bash
# Ver configuração do Traefik
docker exec traefik traefik version

# Ver routers ativos
docker logs traefik | grep backend-ci

# Verificar se backend está registrado
docker exec traefik wget -qO- http://localhost:8080/api/http/routers
```

### **Verificar backend diretamente (bypass Traefik):**

```bash
# Acessar backend DIRETAMENTE (porta 8081)
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"teste","password":"123"}'
```

**Se funcionar diretamente mas não via Traefik = problema no Traefik**

---

## 📊 **POSSÍVEIS CAUSAS ADICIONAIS**

### **1. Traefik não atualizado:**
```bash
docker-compose -f docker-compose.ci.yml restart backend-ci
docker-compose -f docker-compose.ci.yml restart traefik  # se Traefik em compose
```

### **2. Backend não está pronto:**
```bash
docker logs backend-ci | grep "Started SecuredGuardApplication"
```

### **3. Porta errada:**
```bash
docker ps | grep backend-ci
# Verificar se porta 8081 está exposta
```

---

## 🎯 **PRÓXIMOS PASSOS**

1. ✅ **Commit e push** das mudanças
2. ⏱️ **Aguardar** deploy (~5 min)
3. 🧪 **Testar** login novamente
4. 📱 **Se funcionar:** Testar Baileys
5. ❌ **Se não funcionar:** Verificar logs do Traefik

---

## 📝 **COMANDOS ÚTEIS**

```bash
# Ver todos containers CI
docker ps | grep ci

# Logs completos backend
docker logs backend-ci -f

# Logs Traefik
docker logs traefik -f | grep backend

# Reiniciar tudo CI
docker-compose -f docker-compose.ci.yml restart

# Ver configuração Traefik ativa
curl http://localhost:8080/api/rawdata
```

---

**Criado em:** 28/10/2025 20:00  
**Prioridade:** 🔴 CRÍTICA  
**Status:** Aguardando deploy

