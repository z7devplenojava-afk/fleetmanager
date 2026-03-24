# 🚀 EXECUTAR NO PORTAINER AGORA

## 📍 **ACESSE:**
```
https://portainer2.z7botsolutions.com.br
```

---

## 📋 PASSO 1: Criar Banco de Dados

### **No Portainer:**

1. Menu lateral → **Containers**
2. Procure: `secured-guard-db-ci` ou `postgres-ci`
3. Clique no container
4. Clique em **>_ Console**
5. Command: `/bin/sh`
6. Clique em **Connect**
7. Execute:

```bash
psql -U secured_guard_ci -c "CREATE DATABASE evolution_db;"
```

Deve mostrar: `CREATE DATABASE`

---

## 📋 PASSO 2: Criar Stack Evolution API

### **No Portainer:**

1. Menu lateral → **Stacks**
2. Clique em **+ Add stack**
3. **Name:** `evolution-api-whatsapp`
4. **Build method:** `Web editor`
5. **COLE O CONTEÚDO DO ARQUIVO:** `evolution-portainer-stack.yml`

### ⚠️ **IMPORTANTE:**

A stack JÁ INCLUI:
- ✅ Redis próprio (`redis-evolution`)
- ✅ Evolution API
- ✅ Todas as configurações

**NÃO precisa criar Redis separado!**

6. Clique em **Deploy the stack**

---

## 📋 PASSO 3: Aguardar e Verificar

### **Aguarde 1 minuto** para containers iniciarem

### **Verificar Logs:**

1. Menu lateral → **Containers**
2. Procure: `evolution-api-portainer`
3. Clique no container
4. Clique em **📄 Logs**
5. Ative **Auto-refresh logs**

### **Procure por LOOP:**

✅ **SEM LOOP (bom):**
```
[INFO] [ChannelStartupService] Browser: SecuredGuard...
[INFO] [ChannelStartupService] Baileys version...
[INFO] [ChannelStartupService] Group Ignore...

E PARA AQUI (não repete!)
```

❌ **COM LOOP (ruim):**
```
[INFO] [ChannelStartupService] Browser: ...
[INFO] [ChannelStartupService] Browser: ...  ← REPETE!
[INFO] [ChannelStartupService] Browser: ...  ← REPETE!
[INFO] [ChannelStartupService] Browser: ...  ← REPETE!

Fica repetindo infinitamente!
```

---

## 📋 PASSO 4: Testar do seu PC

### **Execute este script:**

```powershell
.\testar-evolution-portainer.ps1
```

**Ou manual:**

```powershell
# 1. Testar API
$test = Invoke-RestMethod -Uri "http://185.225.233.18:9000" -Method GET
Write-Host "API: v$($test.version)"

# 2. Criar instância
$headers = @{ apikey = "B6D711FCDE4D4FD5936544120E713976" }
$body = '{"instanceName":"securedguard","integration":"WHATSAPP-BAILEYS"}'
Invoke-RestMethod -Uri "http://185.225.233.18:9000/instance/create" -Method POST -Headers $headers -Body $body -ContentType "application/json"

# 3. Aguardar
Start-Sleep 20

# 4. Obter QR Code
$qr = Invoke-RestMethod -Uri "http://185.225.233.18:9000/instance/connect/securedguard" -Method GET -Headers $headers
Write-Host "QR Code: $($qr.code.length) caracteres"
```

---

## 📊 RESULTADO ESPERADO

### ✅ **SE FUNCIONAR:**
```
API: v2.1.1
QR Code: 500+ caracteres

✅ SUCESSO!
```

**Acesse:**
- http://185.225.233.18:9000/instance/connect/securedguard
- Header: `apikey: B6D711FCDE4D4FD5936544120E713976`
- Escaneie com WhatsApp: **31971731747**

### ❌ **SE LOOP PERSISTIR:**
```
API: v2.1.1
QR Code: 0 caracteres

❌ Loop confirmado
```

**Solução:**
Usar **Meta Cloud API** (já configurada no backend!)

---

## 🔧 SE DER LOOP (Configuração Alternativa)

### **No Portainer, edite a Stack:**

1. Stacks → `evolution-api-whatsapp` → **Editor**
2. Mude de:
```yaml
- CACHE_REDIS_ENABLED=true
- CACHE_REDIS_URI=redis://redis-evolution:6379/0
```

Para:
```yaml
- CACHE_REDIS_ENABLED=false
- CACHE_LOCAL_ENABLED=true
```

3. **Update the stack**
4. Aguarde ~1 minuto
5. Teste novamente

---

## 📂 ARQUIVOS IMPORTANTES

- **`evolution-portainer-stack.yml`** - COLE ESTE no Portainer
- **`testar-evolution-portainer.ps1`** - Execute do seu PC
- **`GUIA_PORTAINER_EVOLUTION.md`** - Guia completo

---

## 🎯 AGORA:

1. **Acesse:** https://portainer2.z7botsolutions.com.br
2. **Crie o banco:** `evolution_db`
3. **Crie a stack:** Cola o `evolution-portainer-stack.yml`
4. **Teste:** Execute `.\testar-evolution-portainer.ps1`
5. **Reporte:** Funcionou? ✅ ou Loop? ❌

**Boa sorte! 🚀**

