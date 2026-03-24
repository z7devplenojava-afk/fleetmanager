# ✅ Evolution API Pronta!

## 📱 Para escanear o QR Code:

### Opção 1 - Navegador:
```
http://localhost:9000/instance/connect/securedguard
```

### Opção 2 - Arquivo local:
Abra o arquivo: `qrcode.html`

## 📞 Número para escanear:
```
31971731747
```

## ⏭️ Próximos passos:

1. Abra o link acima no navegador
2. Escaneie o QR Code com o WhatsApp 31971731747
3. Aguarde conectar
4. Me avise quando conectado!

## 🧪 Teste após conectar:

```powershell
# Verificar status
$headers = @{ apikey = "B6D711FCDE4D4FD5936544120E713976" }
Invoke-RestMethod -Uri "http://localhost:9000/instance/connectionState/securedguard" -Headers $headers

# Testar envio
$loginBody = @{ username = "jose.ramos"; password = "Admin1234" } | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token

$envioBody = @{ tipo = "WHATSAPP"; cpf = "00824310608"; mes = 9; ano = 2025 } | ConvertTo-Json
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
$envioResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/envio/individual" -Method POST -Body $envioBody -Headers $headers

Write-Host "Sucesso: $($envioResponse.sucesso)"
Write-Host "Mensagem: $($envioResponse.mensagem)"
```

