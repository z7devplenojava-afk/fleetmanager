# 🚀 Instalar Evolution API via Portainer na VPS

## 📋 Pré-requisitos

1. ✅ Acesso ao Portainer da VPS
2. ✅ PostgreSQL rodando (secured-guard-db-ci)
3. ✅ Redis rodando (secured-guard-redis-ci) - OPCIONAL

---

## 🔧 PASSO 1: Criar Stack no Portainer

### **1. Acessar Portainer**
```
URL: https://portainer.z7botsolutions.com.br (ou IP do servidor)
```

### **2. Ir para Stacks**
- Menu lateral → **Stacks**
- Clicar em **+ Add stack**

### **3. Nome da Stack**
```
evolution-api-whatsapp
```

### **4. Web editor - COLAR ESTA CONFIGURAÇÃO:**

```yaml
version: '3.8'

services:
  evolution-api:
    image: atendai/evolution-api:v2.1.1
    container_name: evolution-api-portainer
    ports:
      - "9000:8080"
    environment:
      # URL da Evolution API
      - SERVER_URL=https://evolution.z7botsolutions.com.br
      
      # Autenticação
      - AUTHENTICATION_TYPE=apikey
      - AUTHENTICATION_API_KEY=B6D711FCDE4D4FD5936544120E713976
      - AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
      
      # Configurações de Sessão
      - LANGUAGE=pt-BR
      - CONFIG_SESSION_PHONE_CLIENT=SecuredGuard
      - CONFIG_SESSION_PHONE_NAME=chrome
      - CONFIG_SESSION_PHONE_VERSION=2.2413.51
      
      # QR Code
      - QRCODE_LIMIT=1902
      - QRCODE_COLOR=#000000
      
      # Database Configuration
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://secured_guard_ci:4KaCiJc6an@7sgbdcid2025@secured-guard-db-ci:5432/evolution_db?schema=public
      - DATABASE_CONNECTION_CLIENT_NAME=evolution_portainer
      - DATABASE_SAVE_DATA_INSTANCE=true
      - DATABASE_SAVE_DATA_NEW_MESSAGE=true
      - DATABASE_SAVE_MESSAGE_UPDATE=true
      - DATABASE_SAVE_DATA_CONTACTS=true
      - DATABASE_SAVE_DATA_CHATS=true
      
      # S3 Storage (desabilitado)
      - S3_ENABLED=false
      
      # Cache LOCAL (sem Redis)
      - CACHE_REDIS_ENABLED=false
      - CACHE_LOCAL_ENABLED=true
      
      # Configurações das instâncias
      - DEL_INSTANCE=false
      - DEL_TEMP_INSTANCES=false
      
      # Módulos desabilitados
      - TYPEBOT_ENABLED=false
      - CHATWOOT_ENABLED=false
      - RABBITMQ_ENABLED=false
      
      # Webhook
      - WEBHOOK_GLOBAL_ENABLED=false
      - WEBHOOK_EVENTS_QRCODE_UPDATED=true
      - WEBHOOK_EVENTS_CONNECTION_UPDATE=true
      
      # Logs
      - LOG_LEVEL=INFO
      - LOG_COLOR=true
      
    volumes:
      - evolution_instances:/evolution/instances
      - /var/www/secured_guard/ci/holerites:/evolution/holerites
    
    networks:
      - z7network
    
    # Memória compartilhada para Chromium
    shm_size: 512mb
    
    # Permitir execução do Chromium
    security_opt:
      - seccomp=unconfined
    
    restart: unless-stopped
    
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.evolution-portainer.rule=Host(`evolution.z7botsolutions.com.br`)"
      - "traefik.http.routers.evolution-portainer.entrypoints=websecure"
      - "traefik.http.routers.evolution-portainer.tls.certresolver=letsencryptresolver"
      - "traefik.http.services.evolution-portainer.loadbalancer.server.port=8080"

volumes:
  evolution_instances:
    external: false

networks:
  z7network:
    external: true
```

### **5. Deploy**
- Clicar em **Deploy the stack**
- Aguardar criação (~2-3 minutos)

---

## 🧪 PASSO 2: Criar Banco de Dados

### **Via Portainer Console:**

1. Ir para **Containers**
2. Clicar em **secured-guard-db-ci**
3. Clicar em **>_ Console**
4. Escolher **bash** ou **sh**
5. Executar:

```bash
psql -U secured_guard_ci -c "CREATE DATABASE evolution_db;"
```

### **Ou via SSH:**

```bash
ssh root@ci.z7botsolutions.com.br
docker exec secured-guard-db-ci psql -U secured_guard_ci -c "CREATE DATABASE evolution_db;"
```

---

## 📊 PASSO 3: Verificar Status

### **Via Portainer:**

1. Ir para **Containers**
2. Encontrar **evolution-api-portainer**
3. Verificar status: **Running** ✅
4. Clicar em **Logs** (ícone de papel)
5. Procurar por:
   - ✅ `Module - ON`
   - ✅ `Repository:Prisma - ON`
   - ❌ Loop de `ChannelStartupService` (múltiplas vezes)

### **Via SSH:**

```bash
docker logs evolution-api-portainer --tail 50
```

---

## 📱 PASSO 4: Criar Instância e Obter QR Code

### **Via curl:**

```bash
# 1. Criar instância
curl -X POST https://evolution.z7botsolutions.com.br/instance/create \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "securedguard",
    "integration": "WHATSAPP-BAILEYS"
  }'

# 2. Aguardar 15 segundos
sleep 15

# 3. Obter QR Code
curl -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  https://evolution.z7botsolutions.com.br/instance/connect/securedguard
```

### **Via Navegador:**

1. Abra: `https://evolution.z7botsolutions.com.br/instance/connect/securedguard`
2. Use extensão **ModHeader** para adicionar:
   - Header: `apikey`
   - Value: `B6D711FCDE4D4FD5936544120E713976`
3. Veja o QR Code
4. Escaneie com WhatsApp: **31971731747**

---

## 🔍 PASSO 5: Verificar se QR Code Foi Gerado

### **Via Portainer Logs:**

Procure por:
- ✅ `QR Code generated` ou similar
- ✅ Mensagem única de `ChannelStartupService` (sem loop!)
- ❌ Loop de `ChannelStartupService` repetindo

### **Via curl (do seu PC):**

```powershell
$headers = @{ apikey = "B6D711FCDE4D4FD5936544120E713976" }
$qr = Invoke-RestMethod -Uri "https://evolution.z7botsolutions.com.br/instance/connect/securedguard" -Method GET -Headers $headers
Write-Host "QR Code: $($qr.code.length) caracteres"
```

**Resultado esperado:**
- ✅ **500+ caracteres** = QR Code gerado!
- ❌ **0 caracteres** = Loop ainda persiste

---

## ⚙️ CONFIGURAÇÃO ALTERNATIVA (Se houver loop)

### **Configuração MÍNIMA (sem banco, sem cache):**

```yaml
version: '3.8'

services:
  evolution-api:
    image: atendai/evolution-api:v2.1.1
    container_name: evolution-api-minimal
    ports:
      - "9000:8080"
    environment:
      - SERVER_URL=https://evolution.z7botsolutions.com.br
      - AUTHENTICATION_TYPE=apikey
      - AUTHENTICATION_API_KEY=B6D711FCDE4D4FD5936544120E713976
      - CONFIG_SESSION_PHONE_CLIENT=SecuredGuard
      - CONFIG_SESSION_PHONE_NAME=chrome
      - QRCODE_LIMIT=30
      # TUDO DESABILITADO
      - DATABASE_ENABLED=false
      - CACHE_REDIS_ENABLED=false
      - CACHE_LOCAL_ENABLED=false
      - TYPEBOT_ENABLED=false
      - CHATWOOT_ENABLED=false
      - RABBITMQ_ENABLED=false
      - WEBHOOK_GLOBAL_ENABLED=false
      - LOG_LEVEL=DEBUG
    volumes:
      - evolution_minimal:/evolution/instances
    networks:
      - z7network
    shm_size: 512mb
    security_opt:
      - seccomp=unconfined
    restart: unless-stopped
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.evolution-min.rule=Host(`evolution.z7botsolutions.com.br`)"
      - "traefik.http.routers.evolution-min.entrypoints=websecure"
      - "traefik.http.routers.evolution-min.tls.certresolver=letsencryptresolver"
      - "traefik.http.services.evolution-min.loadbalancer.server.port=8080"

volumes:
  evolution_minimal:

networks:
  z7network:
    external: true
```

---

## 🎯 VANTAGENS DO PORTAINER

1. ✅ **Interface visual** - Fácil ver logs e status
2. ✅ **Edição rápida** - Mudar configs sem editar arquivos
3. ✅ **Restart rápido** - Um clique para reiniciar
4. ✅ **Logs em tempo real** - Ver exatamente o que acontece
5. ✅ **Console direto** - Acessar shell do container

---

## 🔍 TROUBLESHOOTING via Portainer

### **Ver logs em tempo real:**
1. Containers → evolution-api-portainer
2. Logs (ícone de papel)
3. Ativar "Auto-refresh logs"
4. Procurar por erros

### **Acessar shell do container:**
1. Containers → evolution-api-portainer
2. >_ Console
3. Escolher **/bin/sh**
4. Executar:
```bash
which chromium-browser
ls -la /evolution/instances
env | grep -i chrome
```

### **Reiniciar container:**
1. Containers → evolution-api-portainer
2. 🔄 Restart

---

## 📋 CHECKLIST

- [ ] Acessar Portainer
- [ ] Criar stack Evolution API
- [ ] Criar banco evolution_db
- [ ] Verificar container rodando
- [ ] Ver logs (procurar loop)
- [ ] Criar instância
- [ ] Obter QR Code
- [ ] Verificar se gerou (500+ caracteres)
- [ ] Escanear com WhatsApp
- [ ] Testar envio de mensagem

---

## 🆘 SE AINDA HOUVER LOOP VIA PORTAINER

Significa que o bug da Evolution API é **irresolúvel** nesta versão.

**Solução definitiva:**
- **Meta Cloud API** (já está pronta no backend!)

---

## 🎯 PRÓXIMOS PASSOS

1. **Acessar Portainer** da VPS
2. **Criar stack** com a configuração acima
3. **Testar QR Code**
4. **Reportar resultado** (funcionou ou loop persiste?)

**Quer que eu crie um guia visual passo-a-passo com screenshots?** 📸

