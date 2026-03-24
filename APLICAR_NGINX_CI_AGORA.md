# 🚨 APLICAR CONFIGURAÇÃO NGINX NO SERVIDOR CI

## ✅ **CORREÇÃO PRONTA!**

**Arquivo corrigido:** `nginx/ci.conf`  
**Commit:** `31d9057`  
**O que faz:** Nginx → Traefik → Backend (com CORS headers)

---

## 🚀 **COMO APLICAR (NO SERVIDOR CI):**

### **Passo 1: Conectar ao servidor**
```bash
ssh usuario@ci.z7botsolutions.com.br
```

---

### **Passo 2: Ir para o projeto**
```bash
cd /var/www/secured-guard
# Ou onde estiver o projeto
```

---

### **Passo 3: Pull das mudanças**
```bash
git pull origin ci
```

**Esperado:**
```
Updating 96f1b5f..31d9057
Fast-forward
 nginx/ci.conf | 71 ++++++++++++++++++++++++++++++++++++++++-----------
 1 file changed, 49 insertions(+), 22 deletions(-)
```

---

### **Passo 4: Copiar configuração para o Nginx**

**A. Descobrir onde está a configuração do Nginx:**
```bash
# Procurar arquivo
sudo find /etc/nginx -name '*ci*' -o -name '*z7*'

# Ou listar sites habilitados
ls -la /etc/nginx/sites-enabled/
```

**B. Copiar arquivo corrigido:**
```bash
# Exemplo (ajuste o caminho):
sudo cp nginx/ci.conf /etc/nginx/sites-enabled/ci.z7botsolutions.com.br

# OU
sudo cp nginx/ci.conf /etc/nginx/conf.d/ci.conf

# OU 
sudo cp nginx/ci.conf /etc/nginx/nginx.conf
```

---

### **Passo 5: Testar configuração**
```bash
sudo nginx -t
```

**Esperado:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**Se der erro:**
```
# Ver o erro específico
sudo nginx -t

# Reverter
sudo git checkout HEAD~1 nginx/ci.conf
```

---

### **Passo 6: Recarregar Nginx**
```bash
sudo systemctl reload nginx

# OU
sudo nginx -s reload
```

---

### **Passo 7: Verificar se funcionou**
```bash
# Testar login
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

**Resultado esperado:**
- ✅ `401 Unauthorized` ou `{"error": "..."}` = **FUNCIONOU!**
- ❌ `405 Not Allowed` = Ainda com problema

---

## 📋 **O QUE FOI CORRIGIDO:**

### **1. Proxy via Traefik:**
```nginx
# Antes
upstream backend {
    server backend-ci:8081;
}

# Agora
upstream traefik {
    server localhost:80;  # Traefik proxy reverso
}
```

### **2. CORS Headers adicionados:**
```nginx
location /api/ {
    # CORS headers
    add_header 'Access-Control-Allow-Origin' '$http_origin' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD' always;
    
    # Preflight OPTIONS
    if ($request_method = 'OPTIONS') {
        return 204;
    }
    
    proxy_pass http://traefik/api/;
}
```

### **3. Headers X-Forwarded-Host:**
```nginx
proxy_set_header X-Forwarded-Host $host;
```

---

## 🔍 **VERIFICAR APÓS APLICAR:**

### **1. Nginx rodando:**
```bash
sudo systemctl status nginx
```

### **2. Traefik rodando:**
```bash
docker ps | grep traefik
```

### **3. Backend acessível via Traefik:**
```bash
curl http://localhost:80/api/health
```

### **4. Login funcionando:**
```bash
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123"}'
```

---

## ⚠️ **SE NÃO FUNCIONAR:**

### **Verificar porta do Traefik:**
```bash
docker ps | grep traefik

# Se Traefik estiver em outra porta (ex: 8080):
# Editar nginx/ci.conf linha 37:
sudo nano /etc/nginx/sites-enabled/ci.z7botsolutions.com.br

# Mudar:
upstream traefik {
    server localhost:8080;  # Ajustar porta
}

# Recarregar:
sudo nginx -s reload
```

### **Ver logs:**
```bash
# Logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Logs do Traefik
docker logs traefik --tail 50

# Logs do Backend
docker logs backend-ci --tail 50
```

---

## 🎯 **ARQUITETURA CORRETA:**

```
Internet
    ↓
Nginx (porta 80/443) → ci.z7botsolutions.com.br
    ↓
Traefik (localhost:80) → Docker network
    ↓
Backend (backend-ci:8081) → Spring Boot
```

---

## 📝 **RESUMO DOS PASSOS:**

```bash
# 1. Conectar
ssh usuario@ci.z7botsolutions.com.br

# 2. Pull
cd /var/www/secured-guard
git pull origin ci

# 3. Copiar
sudo cp nginx/ci.conf /etc/nginx/sites-enabled/ci.z7botsolutions.com.br

# 4. Testar
sudo nginx -t

# 5. Recarregar
sudo systemctl reload nginx

# 6. Testar login
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

---

**AGORA PRECISA SER APLICADO NO SERVIDOR! 🚀**

**Você tem acesso SSH ao servidor CI?**

