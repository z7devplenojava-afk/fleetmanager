# Script PowerShell para testar Task 12 - Busca de Numeros de Fatura e Medicao
# Execute este script apos o backend estar rodando

Write-Host "=== Teste da Task 12 - Busca de Numeros de Fatura e Medicao ===" -ForegroundColor Green

# Configuracoes
$baseUrl = "http://localhost:8081"
$token = ""

# Funcao para fazer requisicoes HTTP
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Uri,
        [string]$Body = $null,
        [string]$Token = $null
    )
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }
    
    try {
        if ($Body) {
            $response = Invoke-RestMethod -Uri $Uri -Method $Method -Body $Body -Headers $headers
        } else {
            $response = Invoke-RestMethod -Uri $Uri -Method $Method -Headers $headers
        }
        return $response
    }
    catch {
        Write-Host "Erro na requisicao: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# 1. Fazer Login
Write-Host "`n1. Fazendo login..." -ForegroundColor Yellow
$loginData = @{
    username = "superadmin"
    password = "123456"
} | ConvertTo-Json

$loginResponse = Invoke-ApiRequest -Method "POST" -Uri "$baseUrl/api/auth/login" -Body $loginData

if ($loginResponse -and $loginResponse.token) {
    $token = $loginResponse.token
    Write-Host "Login realizado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "Erro no login. Verifique se o backend esta rodando." -ForegroundColor Red
    Write-Host "Tentando iniciar o backend..." -ForegroundColor Yellow
    Start-Process -FilePath "cmd" -ArgumentList "/c", "cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=test" -WindowStyle Minimized
    Write-Host "Aguarde 30 segundos para o backend inicializar..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    exit 1
}

# 2. Testar Endpoints de Busca
Write-Host "`n2. Testando endpoints de busca..." -ForegroundColor Yellow

# Teste 1: Buscar numeros de fatura com "FAT"
Write-Host "`nTeste 1: Buscando numeros de fatura com 'FAT'..." -ForegroundColor Cyan
$faturaResponse1 = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/api/accounts-receivable/search/invoice-number?term=FAT" -Token $token
if ($faturaResponse1) {
    Write-Host "Resultado: $($faturaResponse1 | ConvertTo-Json)" -ForegroundColor White
} else {
    Write-Host "Erro na busca de faturas" -ForegroundColor Red
}

# Teste 2: Buscar numeros de fatura com "2024"
Write-Host "`nTeste 2: Buscando numeros de fatura com '2024'..." -ForegroundColor Cyan
$faturaResponse2 = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/api/accounts-receivable/search/invoice-number?term=2024" -Token $token
if ($faturaResponse2) {
    Write-Host "Resultado: $($faturaResponse2 | ConvertTo-Json)" -ForegroundColor White
} else {
    Write-Host "Erro na busca de faturas" -ForegroundColor Red
}

# Teste 3: Buscar numeros de medicao com "MED"
Write-Host "`nTeste 3: Buscando numeros de medicao com 'MED'..." -ForegroundColor Cyan
$medicaoResponse1 = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/api/accounts-receivable/search/measurement-number?term=MED" -Token $token
if ($medicaoResponse1) {
    Write-Host "Resultado: $($medicaoResponse1 | ConvertTo-Json)" -ForegroundColor White
} else {
    Write-Host "Erro na busca de medicoes" -ForegroundColor Red
}

# Teste 4: Buscar numeros de medicao com "001"
Write-Host "`nTeste 4: Buscando numeros de medicao com '001'..." -ForegroundColor Cyan
$medicaoResponse2 = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/api/accounts-receivable/search/measurement-number?term=001" -Token $token
if ($medicaoResponse2) {
    Write-Host "Resultado: $($medicaoResponse2 | ConvertTo-Json)" -ForegroundColor White
} else {
    Write-Host "Erro na busca de medicoes" -ForegroundColor Red
}

# 3. Resumo dos Testes
Write-Host "`n=== RESUMO DOS TESTES ===" -ForegroundColor Green
Write-Host "Endpoints de busca testados: 4" -ForegroundColor White

Write-Host "`n=== PROXIMOS PASSOS ===" -ForegroundColor Yellow
Write-Host "1. Abra o frontend no navegador" -ForegroundColor White
Write-Host "2. Faca login no sistema" -ForegroundColor White
Write-Host "3. Va para Financeiro > Contas a Receber" -ForegroundColor White
Write-Host "4. Clique em 'Nova Conta' para abrir o modal" -ForegroundColor White
Write-Host "5. Teste os campos 'Numero da Fatura' e 'Numero da Medicao'" -ForegroundColor White
Write-Host "6. Digite 'FAT', '2024', 'MED', '001' para ver as sugestoes" -ForegroundColor White

Write-Host "`nTeste concluido!" -ForegroundColor Green
