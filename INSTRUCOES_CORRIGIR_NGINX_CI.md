# 🚨 URGENTE: Corrigir Nginx no Servidor CI

## 🔴 **PROBLEMA IDENTIFICADO**

**Erro:** `405 Not Allowed` vindo de `nginx/1.29.2`

**Causa:** Nginx no servidor CI está **bloqueando** método POST em `/api/auth/login`

**NÃO é problema do:**
- ❌ Traefik (está OK)
- ❌ Backend (está OK)
- ❌ Código (está OK)

**É problema do:**
- ✅ **Nginx no servidor** (configuração errada)

---

## 📊 **ARQUITETURA**

```
Internet (você)
    ↓
Nginx (servidor CI) ← ESTE está bloqueando 405!
    ↓
Traefik (Docker)
    ↓
Backend (Docker)
```

---

## ✅ **SOLUÇÃO: Executar no Servidor CI**

### **Opção A: Script Automatizado**

**1. Conectar ao servidor:**
```bash
ssh usuario@ci.z7botsolutions.com.br
```

**2. Ir para o projeto:**
```bash
cd /var/www/secured-guard  # ou caminho correto
```

**3. Pull das mudanças:**
```bash
git pull origin ci
```

**4. Executar script:**
```bash
chmod +x FIX_NGINX_CI_405.sh
sudo ./FIX_NGINX_CI_405.sh
```

**5. Seguir instruções do script**

---

### **Opção B: Manual (RÁPIDO)**

**1. Conectar ao servidor:**
```bash
ssh usuario@ci.z7botsolutions.com.br
```

**2. Encontrar configuração do Nginx:**
```bash
# Procurar arquivo de configuração
sudo find /etc/nginx -name '*ci*'

# Ou verificar sites habilitados
ls -la /etc/nginx/sites-enabled/
```

**3. Editar configuração:**
```bash
# Exemplo (ajuste o caminho):
sudo nano /etc/nginx/sites-enabled/ci.z7botsolutions.com.br
```

**4. Encontrar bloco `location /api/` e substituir por:**
```nginx
    # API routes - TODOS os métodos permitidos
    location /api/ {
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '$http_origin' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        
        # Preflight request (OPTIONS)
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '$http_origin' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
        
        # Proxy para Traefik (ajuste a porta se necessário)
        proxy_pass http://localhost:80/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
```

**5. Salvar (Ctrl+O, Enter, Ctrl+X)**

**6. Testar configuração:**
```bash
sudo nginx -t
```

**Esperado:** `syntax is ok` e `test is successful`

**7. Se OK, recarregar:**
```bash
sudo systemctl reload nginx
```

**8. Testar login:**
```bash
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

**Resultado esperado:**
- ✅ `401 Unauthorized` ou `{"error": "..."}` = **FUNCIONOU!**
- ❌ `405 Not Allowed` = Ainda com problema

---

## 🔍 **VERIFICAR CONFIGURAÇÃO ATUAL**

```bash
# Ver configuração do /api/
sudo grep -A 15 "location /api/" /etc/nginx/sites-enabled/*

# Ver todas as configurações do Nginx
sudo nginx -T | grep -A 20 "location /api/"
```

---

## 📝 **PONTOS IMPORTANTES**

### **1. Porta do Proxy**
O Nginx deve fazer proxy para onde o Traefik está escutando:
```nginx
proxy_pass http://localhost:80/api/;  # Se Traefik na porta 80
# OU
proxy_pass http://localhost:8080/api/;  # Se Traefik na porta 8080
```

**Verificar porta do Traefik:**
```bash
docker ps | grep traefik
```

---

### **2. Não remover `/api/` do proxy_pass**

**CORRETO:**
```nginx
location /api/ {
    proxy_pass http://localhost:80/api/;  # Mantém /api/
}
```

**ERRADO:**
```nginx
location /api/ {
    proxy_pass http://localhost:80/;  # Remove /api/ - backend não vai encontrar!
}
```

---

## 🧪 **TESTAR APÓS CORREÇÃO**

### **1. Via curl:**
```bash
# Health check
curl https://ci.z7botsolutions.com.br/api/health

# Login (deve retornar 401, não 405)
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123"}'
```

### **2. Via navegador:**
```
https://ci.z7botsolutions.com.br
```

Tentar fazer login.

---

## ❓ **SE AINDA NÃO FUNCIONAR**

### **Verificar logs do Nginx:**
```bash
# Logs de erro
sudo tail -f /var/log/nginx/error.log

# Logs de acesso
sudo tail -f /var/log/nginx/access.log
```

### **Verificar se o problema é no Traefik:**

**Acessar backend DIRETO (bypass Nginx):**
```bash
# Se Traefik na porta 80
curl -X POST http://localhost:80/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123"}'

# Se Traefik na porta 8080
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123"}'
```

**Se funcionar direto mas não via Nginx = problema no Nginx**

---

## 🎯 **RESUMO**

1. ✅ Problema é **Nginx no servidor CI**
2. ✅ Solução é **corrigir configuração do Nginx**
3. ✅ Precisa **acesso SSH ao servidor**
4. ✅ Tempo estimado: **5 minutos**

---

## 📞 **PRECISA DE AJUDA?**

Se você não tem acesso SSH ao servidor, peça para alguém que tenha executar:

```bash
# Comandos rápidos:
sudo nano /etc/nginx/sites-enabled/ci.z7botsolutions.com.br
# Adicionar CORS e permitir POST
sudo nginx -t
sudo systemctl reload nginx
```

---

**Criado em:** 28/10/2025 20:15  
**Prioridade:** 🔴 CRÍTICA  
**Tempo estimado:** 5 minutos

