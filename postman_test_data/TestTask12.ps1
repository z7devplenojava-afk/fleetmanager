# Script PowerShell para testar Task 12 - Busca de Números de Fatura e Medição
# Execute este script após o backend estar rodando

Write-Host "=== Teste da Task 12 - Busca de Números de Fatura e Medição ===" -ForegroundColor Green

# Configurações
$baseUrl = "http://localhost:8081"
$token = ""

# Função para fazer requisições HTTP
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
        Write-Host "Erro na requisição: $($_.Exception.Message)" -ForegroundColor Red
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
    Write-Host "Erro no login. Verifique se o backend está rodando." -ForegroundColor Red
    exit 1
}

# 2. Criar Cliente 1
Write-Host "`n2. Criando primeiro cliente..." -ForegroundColor Yellow
$cliente1Data = @{
    name = "Empresa ABC Ltda"
    cnpj = "12.345.678/0001-90"
    email = "contato@empresaabc.com"
    phone = "(11) 99999-9999"
    mobile = "(11) 88888-8888"
    address = "Rua das Flores, 123"
    city = "São Paulo"
    state = "SP"
    zipCode = "01234-567"
    contactName = "João Silva"
    contactEmail = "joao@empresaabc.com"
    contactPhone = "(11) 99999-9999"
    status = "ACTIVE"
    notes = "Cliente principal para testes"
} | ConvertTo-Json

$cliente1Response = Invoke-ApiRequest -Method "POST" -Uri "$baseUrl/api/clients" -Body $cliente1Data -Token $token

if ($cliente1Response -and $cliente1Response.id) {
    $cliente1Id = $cliente1Response.id
    Write-Host "Cliente 1 criado com ID: $cliente1Id" -ForegroundColor Green
} else {
    Write-Host "Erro ao criar cliente 1" -ForegroundColor Red
    exit 1
}

# 3. Criar Cliente 2
Write-Host "`n3. Criando segundo cliente..." -ForegroundColor Yellow
$cliente2Data = @{
    name = "Tech Solutions Ltda"
    cnpj = "98.765.432/0001-10"
    email = "contato@techsolutions.com"
    phone = "(11) 55555-5555"
    mobile = "(11) 44444-4444"
    address = "Rua da Tecnologia, 789"
    city = "São Paulo"
    state = "SP"
    zipCode = "04567-890"
    contactName = "Maria Santos"
    contactEmail = "maria@techsolutions.com"
    contactPhone = "(11) 55555-5555"
    status = "ACTIVE"
    notes = "Cliente de tecnologia"
} | ConvertTo-Json

$cliente2Response = Invoke-ApiRequest -Method "POST" -Uri "$baseUrl/api/clients" -Body $cliente2Data -Token $token

if ($cliente2Response -and $cliente2Response.id) {
    $cliente2Id = $cliente2Response.id
    Write-Host "Cliente 2 criado com ID: $cliente2Id" -ForegroundColor Green
} else {
    Write-Host "Erro ao criar cliente 2" -ForegroundColor Red
    exit 1
}

# 4. Criar Contas a Receber
Write-Host "`n4. Criando contas a receber..." -ForegroundColor Yellow

$contasData = @(
    @{
        clientId = $cliente1Id
        invoiceNumber = "FAT-2024-001"
        measurementNumber = "MED-2024-001"
        description = "Serviços de consultoria - Janeiro 2024"
        amount = 15000.00
        amountPaid = 0.00
        issueDate = "2024-01-15"
        dueDate = "2024-02-15"
        status = "OVERDUE"
        category = "SERVICE"
        paymentMethod = "BOLETO"
        notes = "Cliente solicitou prazo adicional"
    },
    @{
        clientId = $cliente2Id
        invoiceNumber = "FAT-2024-002"
        measurementNumber = "MED-2024-002"
        description = "Venda de produtos - Fevereiro 2024"
        amount = 8500.00
        amountPaid = 8500.00
        issueDate = "2024-02-01"
        dueDate = "2024-02-16"
        paymentDate = "2024-02-14"
        status = "PAID"
        category = "PRODUCT"
        paymentMethod = "PIX"
        notes = "Pagamento realizado"
    },
    @{
        clientId = $cliente1Id
        invoiceNumber = "FAT-2024-003"
        measurementNumber = "MED-2024-003"
        description = "Manutenção de sistemas - Março 2024"
        amount = 12000.00
        amountPaid = 6000.00
        issueDate = "2024-03-01"
        dueDate = "2024-03-31"
        status = "PARTIAL"
        category = "SERVICE"
        paymentMethod = "TRANSFER"
        notes = "Pagamento parcial realizado"
    },
    @{
        clientId = $cliente2Id
        invoiceNumber = "FAT-2024-004"
        measurementNumber = "MED-2024-004"
        description = "Desenvolvimento de software - Abril 2024"
        amount = 25000.00
        amountPaid = 0.00
        issueDate = "2024-04-01"
        dueDate = "2024-05-01"
        status = "PENDING"
        category = "SERVICE"
        paymentMethod = "PIX"
        notes = "Projeto em andamento"
    },
    @{
        clientId = $cliente1Id
        invoiceNumber = "FAT-2024-005"
        measurementNumber = "MED-2024-005"
        description = "Consultoria técnica - Maio 2024"
        amount = 8000.00
        amountPaid = 0.00
        issueDate = "2024-05-01"
        dueDate = "2024-05-31"
        status = "PENDING"
        category = "CONSULTANCY"
        paymentMethod = "BOLETO"
        notes = "Consultoria especializada"
    }
)

$contasCriadas = 0
foreach ($conta in $contasData) {
    $contaJson = $conta | ConvertTo-Json
    $contaResponse = Invoke-ApiRequest -Method "POST" -Uri "$baseUrl/api/accounts-receivable" -Body $contaJson -Token $token
    
    if ($contaResponse -and $contaResponse.id) {
        $contasCriadas++
        Write-Host "Conta $($conta.invoiceNumber) criada com sucesso" -ForegroundColor Green
    } else {
        Write-Host "Erro ao criar conta $($conta.invoiceNumber)" -ForegroundColor Red
    }
}

Write-Host "`nTotal de contas criadas: $contasCriadas" -ForegroundColor Green

# 5. Testar Endpoints de Busca
Write-Host "`n5. Testando endpoints de busca..." -ForegroundColor Yellow

# Teste 1: Buscar números de fatura com "FAT"
Write-Host "`nTeste 1: Buscando números de fatura com 'FAT'..." -ForegroundColor Cyan
$faturaResponse1 = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/api/accounts-receivable/search/invoice-number?term=FAT" -Token $token
if ($faturaResponse1) {
    Write-Host "Resultado: $($faturaResponse1 | ConvertTo-Json)" -ForegroundColor White
} else {
    Write-Host "Erro na busca de faturas" -ForegroundColor Red
}

# Teste 2: Buscar números de fatura com "2024"
Write-Host "`nTeste 2: Buscando números de fatura com '2024'..." -ForegroundColor Cyan
$faturaResponse2 = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/api/accounts-receivable/search/invoice-number?term=2024" -Token $token
if ($faturaResponse2) {
    Write-Host "Resultado: $($faturaResponse2 | ConvertTo-Json)" -ForegroundColor White
} else {
    Write-Host "Erro na busca de faturas" -ForegroundColor Red
}

# Teste 3: Buscar números de medição com "MED"
Write-Host "`nTeste 3: Buscando números de medição com 'MED'..." -ForegroundColor Cyan
$medicaoResponse1 = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/api/accounts-receivable/search/measurement-number?term=MED" -Token $token
if ($medicaoResponse1) {
    Write-Host "Resultado: $($medicaoResponse1 | ConvertTo-Json)" -ForegroundColor White
} else {
    Write-Host "Erro na busca de medições" -ForegroundColor Red
}

# Teste 4: Buscar números de medição com "001"
Write-Host "`nTeste 4: Buscando números de medição com '001'..." -ForegroundColor Cyan
$medicaoResponse2 = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/api/accounts-receivable/search/measurement-number?term=001" -Token $token
if ($medicaoResponse2) {
    Write-Host "Resultado: $($medicaoResponse2 | ConvertTo-Json)" -ForegroundColor White
} else {
    Write-Host "Erro na busca de medições" -ForegroundColor Red
}

# 6. Resumo dos Testes
Write-Host "`n=== RESUMO DOS TESTES ===" -ForegroundColor Green
Write-Host "Clientes criados: 2" -ForegroundColor White
Write-Host "Contas a receber criadas: $contasCriadas" -ForegroundColor White
Write-Host "Endpoints de busca testados: 4" -ForegroundColor White

Write-Host "`n=== PRÓXIMOS PASSOS ===" -ForegroundColor Yellow
Write-Host "1. Abra o frontend no navegador" -ForegroundColor White
Write-Host "2. Faça login no sistema" -ForegroundColor White
Write-Host "3. Vá para Financeiro > Contas a Receber" -ForegroundColor White
Write-Host "4. Clique em 'Nova Conta' para abrir o modal" -ForegroundColor White
Write-Host "5. Teste os campos 'Número da Fatura' e 'Número da Medição'" -ForegroundColor White
Write-Host "6. Digite 'FAT', '2024', 'MED', '001' para ver as sugestões" -ForegroundColor White

Write-Host "`nTeste concluido!" -ForegroundColor Green
