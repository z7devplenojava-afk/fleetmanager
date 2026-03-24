# 🔧 Correção: Puppeteer/Chromium para Evolution API

## 🔍 **PROBLEMA IDENTIFICADO:**

O **QR Code não é gerado** porque o **Puppeteer (browser headless)** está falhando ao iniciar.

### **Causas:**
1. ❌ Falta de memória compartilhada (shm)
2. ❌ Chromium não pode executar sandbox
3. ❌ Permissões negadas no diretório `/evolution/instances`

---

## ✅ **SOLUÇÕES APLICADAS:**

### **1. Memória Compartilhada**
```yaml
evolution-api-ci:
  shm_size: 512mb  # ← Chromium precisa disso!
```

### **2. Permitir Sandbox do Chromium**
```yaml
evolution-api-ci:
  security_opt:
    - seccomp=unconfined  # ← Permite Chromium rodar
```

### **3. Variáveis de Ambiente Puppeteer**
```yaml
environment:
  - PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
  - PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
```

### **4. Cache Local (ao invés de Redis)**
```yaml
environment:
  - CACHE_REDIS_ENABLED=false
  - CACHE_LOCAL_ENABLED=true
```

---

## 🚀 **COMO APLICAR:**

### **1. Fazer Push**

```bash
git add docker-compose.ci.yml
git commit -m "fix: Adicionar suporte Puppeteer/Chromium na Evolution API"
git push origin ci
```

### **2. Deploy no Servidor**

GitHub Actions vai fazer automaticamente, **OU** manualmente:

```bash
ssh root@ci.z7botsolutions.com.br
cd /var/www/secured_guard/ci
git pull origin ci
docker-compose -f docker-compose.ci.yml up -d --force-recreate evolution-api-ci
```

### **3. Verificar se Chromium Está Disponível**

```bash
docker exec evolution-api-ci which google-chrome-stable
```

**Se retornar um caminho:** ✅ Chromium instalado  
**Se não retornar nada:** ❌ Chromium não está na imagem

---

## 🧪 **TESTAR APÓS DEPLOY:**

### **1. Aguardar 30 segundos**
```bash
sleep 30
```

### **2. Criar Instância**
```bash
curl -X POST http://185.225.233.18:9000/instance/create \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  -H "Content-Type: application/json" \
  -d '{"instanceName":"securedguard","integration":"WHATSAPP-BAILEYS"}'
```

### **3. Aguardar 15 segundos**
```bash
sleep 15
```

### **4. Obter QR Code**
```bash
curl -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  http://185.225.233.18:9000/instance/connect/securedguard
```

### **5. Verificar Logs**
```bash
docker logs evolution-api-ci --tail 50
```

**Procure por:**
- ✅ `QR Code generated` ou similar
- ❌ `Error launching browser` ou `Failed to launch chrome`

---

## 🔍 **SE CHROMIUM NÃO ESTIVER INSTALADO:**

A imagem `atendai/evolution-api:v2.1.0` deveria vir com Chromium, mas se não estiver:

### **Solução A: Usar imagem com Chromium**

Verificar outras tags que incluem Chromium:
```yaml
image: atendai/evolution-api:v2.1.0-chromium
# ou
image: atendai/evolution-api:latest
```

### **Solução B: Build customizado**

Criar Dockerfile customizado:
```dockerfile
FROM atendai/evolution-api:v2.1.0

# Instalar Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-sandbox \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

---

## 📊 **RESULTADO ESPERADO:**

### ✅ **Sucesso:**
```json
{
  "code": "2@aBcD1234...",  // QR Code com 500+ caracteres
  "base64": "data:image/png;base64,..."
}
```

### ❌ **Falha:**
```json
{
  "code": "",  // String vazia
  "error": "Failed to launch browser"
}
```

---

## 🎯 **ALTERNATIVAS SE NÃO FUNCIONAR:**

### **1. Desabilitar Banco + Cache (modo filesystem)**
```yaml
- DATABASE_ENABLED=false
- CACHE_LOCAL_ENABLED=false
```

### **2. Testar versão anterior**
```yaml
image: atendai/evolution-api:v2.0.0
```

### **3. Aumentar memória**
```yaml
shm_size: 1gb  # Aumentar de 512mb para 1gb
```

### **4. Verificar logs detalhados**
```bash
docker logs evolution-api-ci --tail 200 | grep -i "error\|chrome\|browser"
```

---

## 📋 **CHECKLIST:**

- [ ] Push feito
- [ ] GitHub Actions completo
- [ ] Container recriado
- [ ] Chromium disponível no container
- [ ] Instância criada
- [ ] QR Code gerado (500+ caracteres)
- [ ] Logs sem erros de browser

---

## 🆘 **SE TUDO FALHAR:**

Usar **Meta Cloud API** (já está configurada no backend):

```properties
whatsapp.provider=meta
```

Mas vamos primeiro tentar resolver a Evolution! 💪

