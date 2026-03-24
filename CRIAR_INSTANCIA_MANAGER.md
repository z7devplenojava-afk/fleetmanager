# 📱 Como Criar Instância WhatsApp no Evolution Manager

## ✅ Passo a Passo (FAÇA AGORA)

### 1. No Manager (http://localhost:9000/manager)

Na tela do Manager que está aberta:

1. **Feche o popup** (clique no X no canto superior direito se houver um popup aberto)

2. **Procure o botão para criar nova instância**:
   - Pode ser um botão **"+ Nova Instância"**
   - Ou **"Criar Instância"**
   - Ou um ícone de **"+"**
   - Geralmente fica no canto superior direito ou próximo da lista de instâncias

3. **Preencha o formulário**:
   ```
   Nome: secured-guard-whatsapp
   Integração: Baileys
   Token: (pode deixar vazio ou usar: CCD7AE8A-F0FA-4495-9A7C-90072B45F194)
   Número: (deixe vazio)
   ```

4. **Clique em "Salvar" ou "Criar"**

5. **Após criar**, a instância aparecerá na lista

6. **Clique na instância** criada

7. **Procure o botão "Conectar"** ou ícone de **QR Code**

8. **O QR Code deve aparecer automaticamente** no popup

---

## 🔧 Alternativa: Criar Via API (Se o Manager não funcionar)

Se o Manager continuar com problemas, vou criar via API com configurações especiais para gerar o QR Code:

```powershell
$headers = @{
    "apikey" = "etd2t8kdu5isqdrxh3euhcx0ceflhm92"
    "Content-Type" = "application/json"
}

$body = @{
    "instanceName" = "whatsapp01"
    "integration" = "WHATSAPP-BAILEYS"
    "token" = ""
    "number" = ""
    "qrcode" = $true
    "businessId" = ""
    "webhookUrl" = ""
    "webhookByEvents" = $false
    "webhookBase64" = $false
    "rejectCall" = $false
    "msgCall" = ""
    "groupsIgnore" = $false
    "alwaysOnline" = $false
    "readMessages" = $false
    "readStatus" = $false
    "syncFullHistory" = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:9000/instance/create" -Method Post -Headers $headers -Body $body
```

---

## 📱 Para Obter QR Code Via API

```powershell
# Aguardar 5 segundos após criar
Start-Sleep -Seconds 5

# Obter QR Code
$headers = @{"apikey" = "etd2t8kdu5isqdrxh3euhcx0ceflhm92"}
$qr = Invoke-RestMethod -Uri "http://localhost:9000/instance/connect/whatsapp01" -Headers $headers

# Se retornar base64
if ($qr.base64) {
    # Salvar em HTML
    @"
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>QR Code</title></head>
<body style="display:flex;justify-content:center;align-items:center;min-height:100vh;background:#667eea;">
<img src="$($qr.base64)" style="border:5px solid white;border-radius:10px;">
</body></html>
"@ | Out-File qrcode-final.html -Encoding UTF8
    
    Start-Process qrcode-final.html
}
```

---

## ⚡ Solução Rápida: Use Código de Pareamento

Se o QR Code não funcionar de jeito nenhum, podemos usar **código de pareamento**:

```powershell
$headers = @{
    "apikey" = "etd2t8kdu5isqdrxh3euhcx0ceflhm92"
    "Content-Type" = "application/json"
}

# Criar com código de pareamento ao invés de QR Code
$body = @{
    "instanceName" = "whatsapp01"
    "integration" = "WHATSAPP-BAILEYS"
    "qrcode" = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:9000/instance/create" -Method Post -Headers $headers -Body $body

# Obter código de pareamento
Start-Sleep -Seconds 5
$code = Invoke-RestMethod -Uri "http://localhost:9000/instance/connect/whatsapp01" -Headers $headers
Write-Host "`n📱 CÓDIGO DE PAREAMENTO: $($code.code)`n" -ForegroundColor Green
```

**Como usar o código**:
1. Abra WhatsApp no celular
2. Vá em Dispositivos Conectados
3. Toque em "Conectar dispositivo"
4. Toque em "Conectar com código"
5. Digite o código de 8 dígitos

---

## 🎯 Qual método você prefere?

1. **Manager (Interface Web)** - Mais visual e fácil
2. **API com QR Code** - Mais técnico mas funcional
3. **Código de Pareamento** - Mais simples, sem QR Code

**Me avise qual prefere que eu te ajudo!**

