# 🧪 TESTE META WHATSAPP CLOUD API

## ✅ **STATUS: BACKEND ONLINE COM META CLOUD API!**

---

## 📋 **CONFIGURAÇÃO ATUAL:**

```properties
whatsapp.provider=meta
whatsapp.meta.phone-number-id=856664524196073
whatsapp.meta.access-token=EAAb... (configurado)
whatsapp.meta.api-version=v21.0
```

---

## ⚠️ **ANTES DE TESTAR:**

### **IMPORTANTE: Adicionar número de teste no painel da Meta!**

1. Acesse: https://developers.facebook.com/apps
2. Seu App → WhatsApp → API Setup
3. Procure por: **"Para"** ou **"Recipient phone number"**
4. Clique em **"Manage phone number list"** ou **"Adicionar número de telefone"**
5. Digite: **+5531971731747** (ou o número que você quer testar)
6. Você receberá um **código no WhatsApp**
7. Digite o código para verificar
8. Aguarde confirmação

**SEM ESTE PASSO, A API RETORNARÁ ERRO 403!**

---

## 🧪 **TESTE 1: VIA POSTMAN (RECOMENDADO)**

### Endpoint:
```
POST http://localhost:8081/api/envio/individual
```

### Headers:
```
Content-Type: application/json
Authorization: Bearer SEU_TOKEN_JWT
```

### Body:
```json
{
  "cpf": "00824310608",
  "tipo": "WHATSAPP",
  "mensagem": "Teste Meta Cloud API - Funcionando!"
}
```

### Resultado esperado:
```json
{
  "sucesso": true,
  "mensagem": "Envio concluído",
  "totalEnviados": 1,
  "totalFalhas": 0
}
```

---

## 🧪 **TESTE 2: VIA CURL (WINDOWS PowerShell)**

```powershell
$token = "SEU_TOKEN_JWT_AQUI"

$body = @{
    cpf = "00824310608"
    tipo = "WHATSAPP"
    mensagem = "Teste Meta Cloud API"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8081/api/envio/individual" `
    -Method POST `
    -Headers @{
        "Content-Type"="application/json"
        "Authorization"="Bearer $token"
    } `
    -Body $body
```

---

## 🧪 **TESTE 3: DIRETO NA META API (SEM BACKEND)**

```powershell
$body = @{
    messaging_product = "whatsapp"
    to = "5531971731747"
    type = "text"
    text = @{
        body = "Teste direto da Meta Cloud API!"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://graph.facebook.com/v21.0/856664524196073/messages" `
    -Method POST `
    -Headers @{
        "Authorization"="Bearer EAAbKdo8aZBqABP8wg80vKTLVZB0ssj5ibQvq4OBuZAsVsuKiWKrGXmSXkU7u6aLvqpQcKtcJhOPUsDupbZAurAuKbaxPtZAvSOQULgoYr3tZAmixe4WFj47wZB1Xz04mUUvQirifgh90vfzm8AaW5wKN3k8r9S04jvUuhHeH5TESjFenMRTheFMLZAQhCZAD2ZAzfKVnXaVoEM6PfnDjMVct1CZCWwaI4xwks1ZBuKJYaGuv6jZCQO8V0liAH4d0uGNkiSgZDZD"
        "Content-Type"="application/json"
    } `
    -Body $body
```

---

## 📊 **POSSÍVEIS RESULTADOS:**

### ✅ **SUCESSO (200 OK):**
```json
{
  "messaging_product": "whatsapp",
  "contacts": [{
    "input": "5531971731747",
    "wa_id": "5531971731747"
  }],
  "messages": [{
    "id": "wamid.xxx"
  }]
}
```

### ❌ **ERRO 403 - Número não verificado:**
```json
{
  "error": {
    "message": "(#131030) Recipient phone number not in allowed list",
    "type": "OAuthException",
    "code": 131030
  }
}
```
**Solução:** Adicione o número como destinatário de teste (ver acima)

### ❌ **ERRO 400 - Token inválido:**
```json
{
  "error": {
    "message": "Invalid OAuth access token",
    "type": "OAuthException",
    "code": 190
  }
}
```
**Solução:** Gere um novo Access Token no painel da Meta

---

## 🎯 **CHECKLIST DE TESTE:**

- [ ] Número de teste adicionado no painel da Meta
- [ ] Código de verificação confirmado no WhatsApp
- [ ] Backend online (http://localhost:8081)
- [ ] Provider configurado como "meta"
- [ ] Token JWT obtido (via login)
- [ ] Teste executado
- [ ] Mensagem recebida no WhatsApp

---

## 📞 **NÚMEROS PARA TESTE:**

| Número | CPF | Status |
|--------|-----|--------|
| +55 31 7150 4213 | - | Número da Meta (não pode receber) |
| +55 31 9717 31747 | 00824310608 | ⏳ Adicionar como teste |
| +55 31 9971 42309 | - | ⏳ Adicionar como teste |

---

## 🚀 **PRÓXIMOS PASSOS:**

1. ✅ Adicionar números de teste na Meta
2. ✅ Fazer login e obter JWT token
3. ✅ Enviar teste via Postman
4. ✅ Verificar recebimento no WhatsApp
5. ✅ Testar envio de arquivo (holerite)
6. ✅ Testar envio em massa

---

**Vamos testar agora!** 🚀📱

