# 🚀 Guia Completo: Evolution API via Portainer

## 📍 **URL DO PORTAINER:**
```
https://portainer2.z7botsolutions.com.br
```

---

## 📋 PASSO A PASSO

### **1. Acessar Portainer**

1. Abra: `https://portainer2.z7botsolutions.com.br`
2. Faça login com suas credenciais
3. Selecione o **Environment** correto (geralmente `local` ou `primary`)

---

### **2. Criar Banco de Dados**

Antes de criar a stack, precisamos do banco:

#### **Via Portainer Console:**

1. Menu lateral → **Containers**
2. Procure por: `secured-guard-db-ci` ou `postgres-ci`
3. Clique no nome do container
4. Clique em **>_ Console**
5. Escolha **Command:** `/bin/sh` ou `bash`
6. Clique em **Connect**
7. Execute:

```bash
psql -U secured_guard_ci -c "CREATE DATABASE evolution_db;"
```

Deve retornar: `CREATE DATABASE`

---

### **3. Criar Stack Evolution API**

#### **No Portainer:**

1. Menu lateral → **Stacks**
2. Clique em **+ Add stack**
3. **Name:** `evolution-api-whatsapp`
4. **Build method:** `Web editor`
5. Cole o conteúdo do arquivo **`evolution-portainer-stack.yml`**
6. **Environment variables:** (deixar vazio, já está tudo na stack)
7. Clique em **Deploy the stack**

---

### **4. Aguardar Inicialização**

1. A stack vai criar
2. Container `evolution-api-portainer` vai iniciar
3. Aguarde ~40-60 segundos

---

### **5. Verificar Logs (IMPORTANTE!)**

#### **No Portainer:**

1. Menu lateral → **Containers**
2. Procure: `evolution-api-portainer`
3. Clique no container
4. Clique em **📄 Logs**
5. Ative **Auto-refresh logs** (toggle no topo)
6. Aguarde ~30 segundos observando

#### **Procure por:**

✅ **SEM LOOP (bom):**
```
[INFO] [WA MODULE] Module - ON
[INFO] [PrismaRepository] Repository:Prisma - ON
[INFO] [ChannelStartupService] Browser: SecuredGuard,chrome...
[INFO] [ChannelStartupService] Baileys version env: 2,2413,51
[INFO] [ChannelStartupService] Group Ignore: false
```
**E para por aqui** (apenas 1 vez!)

❌ **COM LOOP (ruim):**
```
[ChannelStartupService] Browser: ...
[ChannelStartupService] Baileys version...
[ChannelStartupService] Group Ignore...
[ChannelStartupService] Browser: ...  ← REPETE!
[ChannelStartupService] Baileys version...  ← REPETE!
[ChannelStartupService] Group Ignore...  ← REPETE!
```
**Fica repetindo infinitamente!**

---

### **6. Testar API**

#### **Do seu PC (PowerShell):**

```powershell
Invoke-RestMethod -Uri "https://evolution.z7botsolutions.com.br" -Method GET
```

**Ou pelo IP:**
```powershell
Invoke-RestMethod -Uri "http://185.225.233.18:9000" -Method GET
```

**Deve retornar:**
```
status  : 200
message : Welcome to the Evolution API, it is working!
version : 2.1.1
```

---

### **7. Criar Instância Evolution**

#### **Do seu PC:**

```powershell
$headers = @{ apikey = "B6D711FCDE4D4FD5936544120E713976" }
$body = @{ 
    instanceName = "securedguard"
    integration = "WHATSAPP-BAILEYS"
} | ConvertTo-Json

$create = Invoke-RestMethod -Uri "http://185.225.233.18:9000/instance/create" -Method POST -Headers $headers -Body $body -ContentType "application/json"

Write-Host "Instância criada: $($create.hash)" -ForegroundColor Green
```

---

### **8. Aguardar e Verificar Logs Novamente**

#### **No Portainer:**

1. Volte para **Containers** → `evolution-api-portainer` → **Logs**
2. **IMPORTANTE:** Aguarde ~20 segundos
3. Observe se `ChannelStartupService` aparece **uma única vez** ou **fica repetindo**

#### **Resultado:**

✅ **Se aparecer 1 vez e parar:** Funcionou!  
❌ **Se ficar repetindo:** Loop confirmado (bug da Evolution)

---

### **9. Obter QR Code**

#### **Do seu PC:**

```powershell
# Aguardar 15 segundos após criar instância
Start-Sleep 15

$headers = @{ apikey = "B6D711FCDE4D4FD5936544120E713976" }
$qr = Invoke-RestMethod -Uri "http://185.225.233.18:9000/instance/connect/securedguard" -Method GET -Headers $headers

if ($qr.code.length -gt 100) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ QR CODE GERADO COM SUCESSO!" -ForegroundColor Green -BackgroundColor DarkGreen
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "QR Code: $($qr.code.length) caracteres" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "ACESSE PARA ESCANEAR:" -ForegroundColor Yellow
    Write-Host "http://185.225.233.18:9000/instance/connect/securedguard" -ForegroundColor White -BackgroundColor Blue
    Write-Host "Ou: https://evolution.z7botsolutions.com.br/instance/connect/securedguard" -ForegroundColor White
    Write-Host ""
    Write-Host "Header: apikey: B6D711FCDE4D4FD5936544120E713976" -ForegroundColor Cyan
    Write-Host "Numero: 31971731747" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ❌ QR CODE VAZIO" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "QR Code: $($qr.code.length) caracteres" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Loop ainda persiste. Use Meta Cloud API." -ForegroundColor Cyan
}
```

---

### **10. Escanear QR Code**

#### **Opção A: Via Navegador**

1. Abra: `http://185.225.233.18:9000/instance/connect/securedguard`
2. Instale extensão **ModHeader** no Chrome
3. Adicione header:
   - **Name:** `apikey`
   - **Value:** `B6D711FCDE4D4FD5936544120E713976`
4. Recarregue a página
5. **Veja o QR Code**
6. Abra WhatsApp no celular: **31971731747**
7. Aparelhos Conectados → Conectar um aparelho
8. Escaneie o QR Code

#### **Opção B: Via Portainer Console**

1. Containers → `evolution-api-portainer` → Console
2. Comando: `/bin/sh`
3. Execute:
```bash
cat /evolution/instances/securedguard/qr.txt
```

Se houver QR Code, vai aparecer!

---

## 🔍 TROUBLESHOOTING VIA PORTAINER

### **Se Evolution não iniciar:**

1. Containers → `evolution-api-portainer`
2. **Stats** - Ver uso de CPU/RAM
3. **Logs** - Ver erros
4. **Inspect** - Ver configurações

### **Se houver loop:**

#### **Solução 1: Desabilitar Banco**

1. Stacks → `evolution-api-whatsapp`
2. **Editor**
3. Trocar:
```yaml
- DATABASE_ENABLED=true
```
Por:
```yaml
- DATABASE_ENABLED=false
```
4. **Update the stack**

#### **Solução 2: Reiniciar Container**

1. Containers → `evolution-api-portainer`
2. 🔄 **Restart**
3. Aguardar 40s
4. Verificar logs novamente

#### **Solução 3: Deletar e Recriar Stack**

1. Stacks → `evolution-api-whatsapp`
2. **Delete this stack**
3. Criar novamente com configuração mínima (ver abaixo)

---

## ⚙️ CONFIGURAÇÃO MÍNIMA (se houver problemas)

Use esta configuração mais simples no Portainer:

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

## 📱 COMANDOS PARA TESTAR (do seu PC)

### **Script PowerShell Completo:**

```powershell
# Testar API
Write-Host "1. Testando API..." -ForegroundColor Yellow
$test = Invoke-RestMethod -Uri "http://185.225.233.18:9000" -Method GET
Write-Host "   ✅ API: v$($test.version)" -ForegroundColor Green
Write-Host ""

# Criar instância
Write-Host "2. Criando instância..." -ForegroundColor Yellow
$headers = @{ apikey = "B6D711FCDE4D4FD5936544120E713976" }
$body = '{"instanceName":"securedguard","integration":"WHATSAPP-BAILEYS"}'
Invoke-RestMethod -Uri "http://185.225.233.18:9000/instance/create" -Method POST -Headers $headers -Body $body -ContentType "application/json" | Out-Null
Write-Host "   ✅ Criada!" -ForegroundColor Green
Write-Host ""

# Aguardar
Write-Host "3. Aguardando 20s..." -ForegroundColor Yellow
Start-Sleep 20
Write-Host ""

# Obter QR Code
Write-Host "4. Obtendo QR Code..." -ForegroundColor Yellow
$qr = Invoke-RestMethod -Uri "http://185.225.233.18:9000/instance/connect/securedguard" -Method GET -Headers $headers

if ($qr.code.length -gt 100) {
    Write-Host ""
    Write-Host "✅ QR CODE GERADO! ($($qr.code.length) caracteres)" -ForegroundColor Green -BackgroundColor DarkGreen
    Write-Host ""
    Write-Host "ACESSE:" -ForegroundColor Yellow
    Write-Host "http://185.225.233.18:9000/instance/connect/securedguard" -ForegroundColor White -BackgroundColor Blue
} else {
    Write-Host ""
    Write-Host "❌ QR Code vazio ($($qr.code.length) caracteres)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Veja logs no Portainer para identificar o problema." -ForegroundColor Yellow
}
```

---

## ✅ CHECKLIST DE INSTALAÇÃO

### **No Portainer:**
- [ ] Login em https://portainer2.z7botsolutions.com.br
- [ ] Criar banco `evolution_db` via console do PostgreSQL
- [ ] Criar stack `evolution-api-whatsapp`
- [ ] Container `evolution-api-portainer` rodando
- [ ] Logs **SEM LOOP** (ChannelStartupService aparece 1 vez)
- [ ] API respondendo: http://185.225.233.18:9000

### **No seu PC:**
- [ ] Criar instância via curl/PowerShell
- [ ] QR Code gerado (500+ caracteres)
- [ ] Acessar URL do QR Code
- [ ] Escanear com WhatsApp: 31971731747
- [ ] Conexão estabelecida

---

## 🎯 RESULTADO ESPERADO

### ✅ **Se funcionar:**
```
✅ Container rodando no Portainer
✅ Logs SEM loop
✅ QR Code gerado (500+ caracteres)
✅ WhatsApp conectado
```

### ❌ **Se loop persistir:**
```
❌ Loop de ChannelStartupService
❌ QR Code vazio (0 caracteres)
→ Usar Meta Cloud API (já configurada!)
```

---

## 📂 ARQUIVO PARA USAR NO PORTAINER

**Arquivo:** `evolution-portainer-stack.yml`

**Copie todo o conteúdo deste arquivo e cole no Web editor do Portainer!**

---

## 🔑 CREDENCIAIS

- **Portainer:** https://portainer2.z7botsolutions.com.br
- **Evolution API Key:** `B6D711FCDE4D4FD5936544120E713976`
- **Instance Name:** `securedguard`
- **WhatsApp Number:** `31971731747`

---

## 📞 URLs Finais

- **Evolution API:** http://185.225.233.18:9000
- **Com SSL (Traefik):** https://evolution.z7botsolutions.com.br
- **QR Code:** http://185.225.233.18:9000/instance/connect/securedguard

---

## 🎯 PRÓXIMOS PASSOS

1. **Acesse:** https://portainer2.z7botsolutions.com.br
2. **Crie o banco** via console
3. **Crie a stack** com o arquivo `evolution-portainer-stack.yml`
4. **Execute** o script PowerShell do seu PC
5. **Reporte** o resultado (funcionou ou loop?)

**Boa sorte! 🚀** Se der loop, temos a Meta Cloud API pronta! 💪

