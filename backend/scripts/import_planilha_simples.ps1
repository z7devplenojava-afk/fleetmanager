# Script simples para importar planilha de funcionários
Write-Host "📊 IMPORTANDO PLANILHA DE FUNCIONÁRIOS" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

# Solicitar caminho da planilha
$planilhaPath = Read-Host "Digite o caminho completo da sua planilha (Excel ou CSV)"

if (-not (Test-Path $planilhaPath)) {
    Write-Host "❌ Arquivo não encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Arquivo encontrado: $planilhaPath" -ForegroundColor Green

# Determinar tipo de arquivo
$extensao = [System.IO.Path]::GetExtension($planilhaPath).ToLower()

if ($extensao -eq ".csv") {
    Write-Host "📄 Arquivo CSV detectado" -ForegroundColor Cyan
    $dados = Import-Csv -Path $planilhaPath -Encoding UTF8
} elseif ($extensao -eq ".xlsx" -or $extensao -eq ".xls") {
    Write-Host "📄 Arquivo Excel detectado" -ForegroundColor Cyan
    
    # Instalar módulo se necessário
    try {
        Import-Module ImportExcel -ErrorAction Stop
    } catch {
        Write-Host "📦 Instalando módulo ImportExcel..." -ForegroundColor Yellow
        Install-Module -Name ImportExcel -Force -Scope CurrentUser
    }
    
    $dados = Import-Excel -Path $planilhaPath
} else {
    Write-Host "❌ Formato não suportado. Use CSV ou Excel." -ForegroundColor Red
    exit 1
}

# Processar dados
$funcionarios = @()

foreach ($linha in $dados) {
    # Tentar diferentes nomes de colunas
    $nome = $linha.nome -or $linha.Nome -or $linha.NOME -or $linha.name -or $linha.Name
    $cpf = $linha.cpf -or $linha.CPF
    $telefone = $linha.telefone -or $linha.Telefone -or $linha.phone -or $linha.Phone -or $linha.whatsapp
    $email = $linha.email -or $linha.Email
    
    if ($nome -and $cpf -and $telefone) {
        # Formatar dados
        $cpfFormatado = $cpf -replace '[^\d]', ''
        $telefoneFormatado = $telefone -replace '[^\d]', ''
        
        # Adicionar código do país se necessário
        if ($telefoneFormatado.Length -eq 11 -and $telefoneFormatado.StartsWith("0")) {
            $telefoneFormatado = "55" + $telefoneFormatado.Substring(1)
        } elseif ($telefoneFormatado.Length -eq 10) {
            $telefoneFormatado = "55" + $telefoneFormatado
        }
        
        $funcionario = @{
            nome = $nome.Trim()
            cpf = $cpfFormatado
            telefone = $telefoneFormatado
            email = if ($email) { $email.Trim() } else { $null }
            possuiWhatsapp = $true
        }
        
        $funcionarios += $funcionario
    }
}

Write-Host "✅ Encontrados $($funcionarios.Count) funcionários válidos" -ForegroundColor Green

# Salvar JSON
$jsonData = @{
    funcionarios = $funcionarios
    total = $funcionarios.Count
    dataImportacao = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}

$jsonPath = "funcionarios_importacao.json"
$jsonData | ConvertTo-Json -Depth 3 | Out-File -FilePath $jsonPath -Encoding UTF8

Write-Host "✅ Arquivo JSON criado: $jsonPath" -ForegroundColor Green

# Mostrar amostra
Write-Host "`n📋 AMOSTRA DOS DADOS:" -ForegroundColor Yellow
$funcionarios | Select-Object -First 5 | Format-Table -AutoSize

Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Verifique os dados no arquivo: funcionarios_importacao.json" -ForegroundColor Cyan
Write-Host "2. Execute: .\import_funcionarios.ps1" -ForegroundColor Cyan
Write-Host "3. Teste o envio de holerites via WhatsApp" -ForegroundColor Cyan

Write-Host "`n🎉 IMPORTAÇÃO CONCLUÍDA!" -ForegroundColor Green 