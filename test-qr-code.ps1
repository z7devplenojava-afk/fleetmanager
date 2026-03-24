$response = Invoke-WebRequest -Uri "http://localhost:3333/instance/qr?key=securedguard&format=base64" -Method GET -UseBasicParsing
Write-Host "Status Code: $($response.StatusCode)"
$json = $response.Content | ConvertFrom-Json
Write-Host "QR Code Base64 Length: $($json.base64.Length)"
Write-Host "QR Code disponível: $($json.base64.Length -gt 0)"

