# ========================================
# SCRIPT DE IMPORTAÇÃO DE FUNCIONÁRIOS
# ========================================
# Este script importa dados de funcionários de uma planilha Excel/CSV

Write-Host "📊 IMPORTANDO DADOS DE FUNCIONÁRIOS" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# ========================================
# 1. VERIFICAR PRÉ-REQUISITOS
# ========================================
Write-Host "`n📋 Verificando pré-requisitos..." -ForegroundColor Yellow

# Verificar se o arquivo da planilha existe
$planilhaPath = Read-Host "Digite o caminho completo da planilha (Excel ou CSV)"

if (-not (Test-Path $planilhaPath)) {
    Write-Host "❌ Arquivo não encontrado: $planilhaPath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Arquivo encontrado: $planilhaPath" -ForegroundColor Green

# ========================================
# 2. DETERMINAR TIPO DE ARQUIVO
# ========================================
$extensao = [System.IO.Path]::GetExtension($planilhaPath).ToLower()

if ($extensao -eq ".csv") {
    Write-Host "📄 Arquivo CSV detectado" -ForegroundColor Cyan
    $tipoArquivo = "csv"
} elseif ($extensao -eq ".xlsx" -or $extensao -eq ".xls") {
    Write-Host "📄 Arquivo Excel detectado" -ForegroundColor Cyan
    $tipoArquivo = "excel"
} else {
    Write-Host "❌ Formato de arquivo não suportado. Use CSV ou Excel." -ForegroundColor Red
    exit 1
}

# ========================================
# 3. INSTALAR DEPENDÊNCIAS SE NECESSÁRIO
# ========================================
if ($tipoArquivo -eq "excel") {
    Write-Host "`n📦 Verificando dependências para Excel..." -ForegroundColor Yellow
    
    try {
        Import-Module ImportExcel -ErrorAction Stop
        Write-Host "✅ Módulo ImportExcel já instalado" -ForegroundColor Green
    } catch {
        Write-Host "📦 Instalando módulo ImportExcel..." -ForegroundColor Yellow
        Install-Module -Name ImportExcel -Force -Scope CurrentUser
        Write-Host "✅ Módulo ImportExcel instalado" -ForegroundColor Green
    }
}

# ========================================
# 4. LER DADOS DA PLANILHA
# ========================================
Write-Host "`n📖 Lendo dados da planilha..." -ForegroundColor Yellow

$funcionarios = @()

if ($tipoArquivo -eq "csv") {
    # Ler CSV
    $dados = Import-Csv -Path $planilhaPath -Encoding UTF8
    
    foreach ($linha in $dados) {
        $funcionario = @{
            nome = $linha.nome -or $linha.Nome -or $linha.NOME
            cpf = $linha.cpf -or $linha.CPF
            telefone = $linha.telefone -or $linha.Telefone -or $linha.phone -or $linha.Phone
            email = $linha.email -or $linha.Email
            possuiWhatsapp = $true
        }
        
        if ($funcionario.nome -and $funcionario.cpf -and $funcionario.telefone) {
            $funcionarios += $funcionario
        }
    }
} else {
    # Ler Excel
    $dados = Import-Excel -Path $planilhaPath
    
    foreach ($linha in $dados) {
        $funcionario = @{
            nome = $linha.nome -or $linha.Nome -or $linha.NOME
            cpf = $linha.cpf -or $linha.CPF
            telefone = $linha.telefone -or $linha.Telefone -or $linha.phone -or $linha.Phone
            email = $linha.email -or $linha.Email
            possuiWhatsapp = $true
        }
        
        if ($funcionario.nome -and $funcionario.cpf -and $funcionario.telefone) {
            $funcionarios += $funcionario
        }
    }
}

Write-Host "✅ Encontrados $($funcionarios.Count) funcionários válidos" -ForegroundColor Green

# ========================================
# 5. FORMATAR DADOS
# ========================================
Write-Host "`n🔧 Formatando dados..." -ForegroundColor Yellow

$funcionariosFormatados = @()

foreach ($func in $funcionarios) {
    # Formatar CPF (remover pontos e traços)
    $cpfFormatado = $func.cpf -replace '[^\d]', ''
    
    # Formatar telefone (adicionar código do país se necessário)
    $telefoneFormatado = $func.telefone -replace '[^\d]', ''
    if ($telefoneFormatado.Length -eq 11 -and $telefoneFormatado.StartsWith("0")) {
        $telefoneFormatado = "55" + $telefoneFormatado.Substring(1)
    } elseif ($telefoneFormatado.Length -eq 10) {
        $telefoneFormatado = "55" + $telefoneFormatado
    }
    
    $funcionarioFormatado = @{
        nome = $func.nome.Trim()
        cpf = $cpfFormatado
        telefone = $telefoneFormatado
        email = if ($func.email) { $func.email.Trim() } else { $null }
        possuiWhatsapp = $true
    }
    
    $funcionariosFormatados += $funcionarioFormatado
}

# ========================================
# 6. CRIAR JSON PARA IMPORTAÇÃO
# ========================================
Write-Host "`n📝 Criando arquivo JSON para importação..." -ForegroundColor Yellow

$jsonData = @{
    funcionarios = $funcionariosFormatados
    total = $funcionariosFormatados.Count
    dataImportacao = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}

$jsonPath = "funcionarios_importacao.json"
$jsonData | ConvertTo-Json -Depth 3 | Out-File -FilePath $jsonPath -Encoding UTF8

Write-Host "✅ Arquivo JSON criado: $jsonPath" -ForegroundColor Green

# ========================================
# 7. CRIAR SCRIPT DE IMPORTAÇÃO
# ========================================
Write-Host "`n📝 Criando script de importação..." -ForegroundColor Yellow

$importScript = @"
# ========================================
# SCRIPT DE IMPORTAÇÃO DE FUNCIONÁRIOS
# ========================================

Write-Host "🚀 Importando funcionários para o SecureGuard..." -ForegroundColor Green

# URL da API
`$apiUrl = "http://localhost:8080/api/employees"

# Ler dados do JSON
`$jsonData = Get-Content "funcionarios_importacao.json" | ConvertFrom-Json

Write-Host "📊 Importando `$(`$jsonData.total) funcionários..." -ForegroundColor Yellow

`$sucessos = 0
`$falhas = 0

foreach (`$func in `$jsonData.funcionarios) {
    try {
        `$payload = @{
            name = `$func.nome
            document = `$func.cpf
            phone = `$func.telefone
            email = `$func.email
            possuiWhatsapp = `$func.possuiWhatsapp
        } | ConvertTo-Json

        `$headers = @{
            "Content-Type" = "application/json"
        }

        `$response = Invoke-RestMethod -Uri `$apiUrl -Method POST -Body `$payload -Headers `$headers

        Write-Host "✅ Importado: `$(`$func.nome) - `$(`$func.cpf)" -ForegroundColor Green
        `$sucessos++
    } catch {
        Write-Host "❌ Erro ao importar `$(`$func.nome): `$(`$_.Exception.Message)" -ForegroundColor Red
        `$falhas++
    }
}

Write-Host "`n📊 RESUMO DA IMPORTAÇÃO:" -ForegroundColor Cyan
Write-Host "✅ Sucessos: `$sucessos" -ForegroundColor Green
Write-Host "❌ Falhas: `$falhas" -ForegroundColor Red
Write-Host "📊 Total: `$(`$jsonData.total)" -ForegroundColor Yellow
"@

$importScript | Out-File -FilePath "import_funcionarios.ps1" -Encoding UTF8
Write-Host "✅ Script de importação criado: import_funcionarios.ps1" -ForegroundColor Green

# ========================================
# 8. MOSTRAR RESUMO
# ========================================
Write-Host "`n📊 RESUMO DOS DADOS:" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "📄 Arquivo: $planilhaPath" -ForegroundColor White
Write-Host "👥 Total de funcionários: $($funcionariosFormatados.Count)" -ForegroundColor White
Write-Host "📱 Com WhatsApp: $($funcionariosFormatados.Count)" -ForegroundColor White
Write-Host "📧 Com email: $($funcionariosFormatados.Where({$_.email}).Count)" -ForegroundColor White

Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Verifique os dados no arquivo: funcionarios_importacao.json" -ForegroundColor Cyan
Write-Host "2. Execute o script de importação: .\import_funcionarios.ps1" -ForegroundColor Cyan
Write-Host "3. Verifique os funcionários no sistema SecureGuard" -ForegroundColor Cyan

Write-Host "`n🔍 AMOSTRA DOS DADOS:" -ForegroundColor Yellow
$funcionariosFormatados | Select-Object -First 3 | Format-Table -AutoSize

Write-Host "`n🎉 IMPORTAÇÃO PREPARADA COM SUCESSO!" -ForegroundColor Green 