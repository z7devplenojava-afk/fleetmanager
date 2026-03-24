# ⚠️ Problema: QR Code não Exibe na Evolution API v2

## 🔍 Diagnóstico

A instância está entrando em loop de reconexão contínua sem gerar o QR Code. Isso acontece devido a:

1. **Problema de compatibilidade** entre Evolution API v2 + Baileys + Windows/WSL
2. A instância tenta conectar repetidamente (logs mostram ciclos de 2-6 segundos)
3. O endpoint `/instance/connect` retorna vazio

## ✅ SOLUÇÃO: Use o Manager Web

### **Método 1: Interface Web da Evolution API (RECOMENDADO)**

1. **Abra no navegador**: http://localhost:9000/manager

2. **Na interface, você verá**:
   - Lista de instâncias
   - Instância `secured-guard-whatsapp` criada
   - Botão para conectar/ver QR Code

3. **Clique na instância** e depois em **"Conectar"** ou **"QR Code"**

4. **O QR Code será gerado automaticamente** e exibido na interface

5. **Escaneie com seu WhatsApp**

---

### **Método 2: Usar código de pareamento (alternativa)**

Se o QR Code não funcionar, você pode usar código de pareamento:

```powershell
$headers = @{
    "apikey" = "etd2t8kdu5isqdrxh3euhcx0ceflhm92"
    "Content-Type" = "application/json"
}

$body = @{
    "instanceName" = "secured-guard-whatsapp"
    "integration" = "WHATSAPP-BAILEYS"
    "qrcode" = $false
    "mobile" = $true
} | ConvertTo-Json

# Deletar instância atual
Invoke-RestMethod -Uri "http://localhost:9000/instance/delete/secured-guard-whatsapp" `
    -Headers $headers -Method Delete

# Aguardar
Start-Sleep -Seconds 3

# Recriar com código de pareamento
Invoke-RestMethod -Uri "http://localhost:9000/instance/create" `
    -Method Post -Headers $headers -Body $body
```

Isso vai gerar um **código de 8 dígitos** que você digita direto no WhatsApp.

---

### **Método 3: Atualizar versão do WhatsApp Web**

O problema pode ser a versão do WhatsApp Web configurada. Vamos usar a mais recente:

**Edite o `docker-compose.yml`** e altere:

```yaml
- CONFIG_SESSION_PHONE_VERSION=2.2413.51
```

Para a versão mais recente (pegue em https://web.whatsapp.com/check-update?version=0&platform=web):

```yaml
- CONFIG_SESSION_PHONE_VERSION=2.3000.0
```

Depois reinicie:
```bash
docker-compose down
docker-compose up -d
```

---

## 🎯 TESTE AGORA - Passo a Passo

### Usando a Interface Web (Mais Fácil):

1. ✅ Abri o Manager para você: **http://localhost:9000/manager**

2. ✅ Na interface, procure por **"secured-guard-whatsapp"**

3. ✅ Clique no botão **"Conectar"** ou no ícone de **QR Code**

4. ✅ O QR Code deve aparecer **automaticamente**

5. ✅ Abra seu WhatsApp:
   - Android: Menu > Dispositivos conectados > Conectar dispositivo
   - iPhone: Configurações > Dispositivos conectados > Conectar dispositivo

6. ✅ Escaneie o QR Code

---

## 📊 Verificar se Conectou

Após escanear, execute:

```powershell
$headers = @{"apikey" = "etd2t8kdu5isqdrxh3euhcx0ceflhm92"}
$status = Invoke-RestMethod -Uri "http://localhost:9000/instance/connectionState/secured-guard-whatsapp" -Headers $headers
$status | ConvertTo-Json
```

Deve mostrar: `"state": "open"`

---

## 🐛 Se Ainda Não Funcionar

### Solução Drástica: Usar Evolution API v1

Se a v2 continuar com problemas, podemos voltar para a v1 que é mais estável:

```yaml
image: atendai/evolution-api:v1.7.5
```

A v1 tem QR Code mais confiável, especialmente no Windows.

---

## 💡 Recomendação Final

**Use a interface web (Manager)** - é a forma oficial e mais confiável de visualizar o QR Code na Evolution API v2.

A URL já está aberta no seu navegador: **http://localhost:9000/manager**

---

**Status Atual**:
- ✅ Evolution API rodando
- ✅ Instância criada
- ⏳ Aguardando QR Code no Manager

