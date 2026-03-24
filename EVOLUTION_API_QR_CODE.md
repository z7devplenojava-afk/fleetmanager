# 📱 EVOLUTION API - QR CODE

## 🔗 Link para QR Code:
```
http://localhost:9000/instance/connect/securedguard
```

## 📞 Número para escanear:
```
31971731747
```

## ✅ Após escanear:
Execute este comando para testar:

```powershell
$loginBody = @{ username = "jose.ramos"; password = "Admin1234" } | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token

$envioBody = @{ tipo = "WHATSAPP"; cpf = "00824310608"; mes = 9; ano = 2025 } | ConvertTo-Json
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
$envioResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/envio/individual" -Method POST -Body $envioBody -Headers $headers

Write-Host "Sucesso: $($envioResponse.sucesso)" -ForegroundColor Green
Write-Host "Mensagem: $($envioResponse.mensagem)"
```

## 📋 Credenciais Evolution API:
- **API Key:** B6D711FCDE4D4FD5936544120E713976
- **Instance:** securedguard
- **URL:** http://localhost:9000

