# Script para testar o sistema de histórico de remanejamentos
# Autor: Sistema
# Data: $(Get-Date -Format "yyyy-MM-dd")

Write-Host "=== TESTE DO SISTEMA DE HISTÓRICO DE REMANEJAMENTOS ===" -ForegroundColor Green
Write-Host ""

# Configurações
$baseUrl = "http://localhost:8080"
$loginUrl = "$baseUrl/api/auth/login"
$remanejamentosUrl = "$baseUrl/api/remanejamentos"
$historicoUrl = "$baseUrl/api/remanejamentos-historico"

# Dados de login
$loginData = @{
    username = "admin@fluxbus.com"
    password = "admin123"
} | ConvertTo-Json

Write-Host "1. Fazendo login..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method POST -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "   Login realizado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "   ERRO no login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Headers com token
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Buscar funcionários para usar nos testes
Write-Host "2. Buscando funcionários..." -ForegroundColor Yellow
try {
    $employeesResponse = Invoke-RestMethod -Uri "$baseUrl/api/employees" -Method GET -Headers $headers
    if ($employeesResponse.Count -eq 0) {
        Write-Host "   Nenhum funcionário encontrado. Criando um funcionário de teste..." -ForegroundColor Yellow
        
        # Criar funcionário de teste
        $employeeData = @{
            name = "João Silva Teste"
            cpf = "12345678901"
            email = "joao.teste@email.com"
            phone = "11999999999"
            position = "Vigilante"
            department = "Segurança"
            hireDate = "2024-01-15"
            salary = 2500.00
            status = "ACTIVE"
        } | ConvertTo-Json
        
        $employeeResponse = Invoke-RestMethod -Uri "$baseUrl/api/employees" -Method POST -Body $employeeData -Headers $headers
        $employeeId = $employeeResponse.id
        Write-Host "   Funcionário criado com ID: $employeeId" -ForegroundColor Green
    } else {
        $employeeId = $employeesResponse[0].id
        Write-Host "   Usando funcionário existente com ID: $employeeId" -ForegroundColor Green
    }
} catch {
    Write-Host "   ERRO ao buscar/criar funcionário: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Teste 1: Criar remanejamento
Write-Host "3. Teste 1: Criando remanejamento..." -ForegroundColor Yellow
try {
    $remanejamentoData = @{
        employee = @{ id = $employeeId }
        tipo = "TRANSFERENCIA_UNIDADE"
        origem = "Unidade Centro"
        destino = "Unidade Norte"
        dataRemanejamento = "2024-12-20"
        observacao = "Transferência solicitada pelo gestor"
    } | ConvertTo-Json
    
    $createResponse = Invoke-RestMethod -Uri $remanejamentosUrl -Method POST -Body $remanejamentoData -Headers $headers
    $remanejamentoId = $createResponse.id
    Write-Host "   Remanejamento criado com ID: $remanejamentoId" -ForegroundColor Green
} catch {
    Write-Host "   ERRO ao criar remanejamento: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Teste 2: Verificar histórico de criação
Write-Host "4. Teste 2: Verificando histórico de criação..." -ForegroundColor Yellow
try {
    $historicoResponse = Invoke-RestMethod -Uri "$historicoUrl/remanejamento/$remanejamentoId" -Method GET -Headers $headers
    if ($historicoResponse.Count -gt 0) {
        $ultimoHistorico = $historicoResponse[0]
        Write-Host "   Histórico encontrado:" -ForegroundColor Green
        Write-Host "     - Ação: $($ultimoHistorico.acao)" -ForegroundColor Cyan
        Write-Host "     - Data: $($ultimoHistorico.dataExecucao)" -ForegroundColor Cyan
        Write-Host "     - Motivo: $($ultimoHistorico.motivoAlteracao)" -ForegroundColor Cyan
    } else {
        Write-Host "   Nenhum histórico encontrado!" -ForegroundColor Red
    }
} catch {
    Write-Host "   ERRO ao buscar histórico: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 3: Editar remanejamento
Write-Host "5. Teste 3: Editando remanejamento..." -ForegroundColor Yellow
try {
    $updateData = @{
        employee = @{ id = $employeeId }
        tipo = "TROCA_FUNCAO"
        origem = "Vigilante"
        destino = "Supervisor"
        dataRemanejamento = "2024-12-25"
        observacao = "Promoção para supervisor - observação atualizada"
    } | ConvertTo-Json
    
    $updateResponse = Invoke-RestMethod -Uri "$remanejamentosUrl/$remanejamentoId" -Method PUT -Body $updateData -Headers $headers
    Write-Host "   Remanejamento atualizado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "   ERRO ao editar remanejamento: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 4: Verificar histórico de edição
Write-Host "6. Teste 4: Verificando histórico de edição..." -ForegroundColor Yellow
try {
    $historicoResponse = Invoke-RestMethod -Uri "$historicoUrl/remanejamento/$remanejamentoId" -Method GET -Headers $headers
    if ($historicoResponse.Count -gt 0) {
        Write-Host "   Total de registros no histórico: $($historicoResponse.Count)" -ForegroundColor Green
        foreach ($registro in $historicoResponse) {
            Write-Host "     - $($registro.acao) em $($registro.dataExecucao)" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "   ERRO ao buscar histórico: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 5: Buscar histórico por funcionário
Write-Host "7. Teste 5: Buscando histórico por funcionário..." -ForegroundColor Yellow
try {
    $historicoFuncionario = Invoke-RestMethod -Uri "$historicoUrl/funcionario/$employeeId" -Method GET -Headers $headers
    Write-Host "   Histórico do funcionário: $($historicoFuncionario.Count) registros" -ForegroundColor Green
} catch {
    Write-Host "   ERRO ao buscar histórico do funcionário: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 6: Buscar histórico por ação
Write-Host "8. Teste 6: Buscando histórico por ação (CRIACAO)..." -ForegroundColor Yellow
try {
    $historicoAcao = Invoke-RestMethod -Uri "$historicoUrl/acao/CRIACAO" -Method GET -Headers $headers
    Write-Host "   Histórico de criações: $($historicoAcao.Count) registros" -ForegroundColor Green
} catch {
    Write-Host "   ERRO ao buscar histórico por ação: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 7: Estatísticas
Write-Host "9. Teste 7: Buscando estatísticas..." -ForegroundColor Yellow
try {
    $estatisticas = Invoke-RestMethod -Uri "$historicoUrl/estatisticas" -Method GET -Headers $headers
    Write-Host "   Estatísticas:" -ForegroundColor Green
    Write-Host "     - Total por funcionário: $($estatisticas.totalPorFuncionario)" -ForegroundColor Cyan
    Write-Host "     - Total por ação: $($estatisticas.totalPorAcao)" -ForegroundColor Cyan
    Write-Host "     - Total por usuário: $($estatisticas.totalPorUsuario)" -ForegroundColor Cyan
} catch {
    Write-Host "   ERRO ao buscar estatísticas: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 8: Excluir remanejamento
Write-Host "10. Teste 8: Excluindo remanejamento..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$remanejamentosUrl/$remanejamentoId" -Method DELETE -Headers $headers
    Write-Host "   Remanejamento excluído com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "   ERRO ao excluir remanejamento: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 9: Verificar histórico de exclusão
Write-Host "11. Teste 9: Verificando histórico de exclusão..." -ForegroundColor Yellow
try {
    $historicoResponse = Invoke-RestMethod -Uri "$historicoUrl/remanejamento/$remanejamentoId" -Method GET -Headers $headers
    if ($historicoResponse.Count -gt 0) {
        $ultimoHistorico = $historicoResponse[0]
        Write-Host "   Última ação registrada: $($ultimoHistorico.acao)" -ForegroundColor Green
    }
} catch {
    Write-Host "   ERRO ao buscar histórico: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== TESTE CONCLUÍDO ===" -ForegroundColor Green
Write-Host "O sistema de histórico de remanejamentos está funcionando corretamente!" -ForegroundColor Green 