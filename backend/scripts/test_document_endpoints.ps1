# Script para testar endpoints de documentos
$baseUrl = "http://localhost:8080/api"

Write-Host "=== Testando Endpoints de Documentos ===" -ForegroundColor Green

# 1. Testar login para obter token
Write-Host "`n1. Fazendo login..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@empresa.com"
    password = "admin123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token

Write-Host "Token obtido: $($token.Substring(0, 20))..." -ForegroundColor Green

# 2. Testar obter tipos de documentos
Write-Host "`n2. Obtendo tipos de documentos..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $typesResponse = Invoke-RestMethod -Uri "$baseUrl/documents/types" -Method GET -Headers $headers
    Write-Host "Tipos de documentos disponíveis:" -ForegroundColor Green
    $typesResponse | ForEach-Object { Write-Host "  - $_" -ForegroundColor Cyan }
} catch {
    Write-Host "Erro ao obter tipos de documentos: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Testar obter todos os documentos
Write-Host "`n3. Obtendo todos os documentos..." -ForegroundColor Yellow
try {
    $documentsResponse = Invoke-RestMethod -Uri "$baseUrl/documents" -Method GET -Headers $headers
    Write-Host "Total de documentos: $($documentsResponse.Count)" -ForegroundColor Green
    if ($documentsResponse.Count -gt 0) {
        Write-Host "Primeiro documento:" -ForegroundColor Cyan
        Write-Host "  ID: $($documentsResponse[0].id)" -ForegroundColor White
        Write-Host "  Tipo: $($documentsResponse[0].type)" -ForegroundColor White
        Write-Host "  Número: $($documentsResponse[0].number)" -ForegroundColor White
    }
} catch {
    Write-Host "Erro ao obter documentos: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Testar obter documentos expirando
Write-Host "`n4. Obtendo documentos expirando..." -ForegroundColor Yellow
try {
    $expiringResponse = Invoke-RestMethod -Uri "$baseUrl/documents/expiring" -Method GET -Headers $headers
    Write-Host "Documentos expirando: $($expiringResponse.Count)" -ForegroundColor Green
} catch {
    Write-Host "Erro ao obter documentos expirando: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Teste concluído ===" -ForegroundColor Green 