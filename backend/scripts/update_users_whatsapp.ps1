# ========================================
# SCRIPT PARA ATUALIZAR WHATSAPP NA TABELA USERS
# ========================================
# Este script le o JSON e atualiza o campo whatsapp na tabela users

Write-Host "ATUALIZANDO WHATSAPP NA TABELA USERS" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

# Verificar se o arquivo JSON existe
$jsonPath = "funcionarios_importacao.json"
if (-not (Test-Path $jsonPath)) {
    Write-Host "Arquivo funcionarios_importacao.json nao encontrado!" -ForegroundColor Red
    Write-Host "Execute primeiro: .\import_planilha_simples.ps1" -ForegroundColor Yellow
    exit 1
}

# Ler dados do JSON
$jsonData = Get-Content $jsonPath | ConvertFrom-Json
Write-Host "Encontrados $($jsonData.total) funcionarios no JSON" -ForegroundColor Yellow

# Configuracoes do banco de dados
$dbHost = "localhost"
$dbPort = "5432"
$dbName = "fluxbus_dev"
$dbUser = "postgres"
$dbPassword = "1234567"

# Criar arquivo SQL temporario
$sqlFile = "update_users_whatsapp_temp.sql"

# Cabecalho do SQL
$sqlContent = @"
-- ========================================
-- SCRIPT GERADO AUTOMATICAMENTE
-- ========================================
-- Data: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- Total de funcionarios: $($jsonData.total)

-- Criar tabela temporaria
CREATE TEMP TABLE temp_funcionarios (
    nome VARCHAR(255),
    cpf VARCHAR(14),
    telefone VARCHAR(20),
    email VARCHAR(255),
    possui_whatsapp BOOLEAN
);

-- Inserir dados do JSON
"@

# Adicionar dados do JSON
foreach ($func in $jsonData.funcionarios) {
    $nome = $func.nome -replace "'", "''"  # Escapar aspas simples
    $cpf = $func.cpf
    $telefone = $func.telefone
    $email = if ($func.email) { $func.email -replace "'", "''" } else { "NULL" }
    $possuiWhatsapp = $func.possuiWhatsapp
    
    $sqlContent += "`nINSERT INTO temp_funcionarios (nome, cpf, telefone, email, possui_whatsapp) VALUES ('$nome', '$cpf', '$telefone', $email, $possuiWhatsapp);"
}

# Adicionar comandos de atualizacao
$sqlContent += @"

-- Verificar dados antes da atualizacao
SELECT 
    u.id,
    u.username as cpf_atual,
    u.whatsapp as whatsapp_atual,
    t.nome,
    t.cpf as cpf_json,
    t.telefone as telefone_json
FROM users u
LEFT JOIN temp_funcionarios t ON u.username = t.cpf
WHERE t.cpf IS NOT NULL
ORDER BY u.id;

-- Atualizar o campo whatsapp apenas onde ha correspondencia de CPF
UPDATE users 
SET whatsapp = temp_funcionarios.telefone
FROM temp_funcionarios 
WHERE users.username = temp_funcionarios.cpf
AND temp_funcionarios.telefone IS NOT NULL
AND temp_funcionarios.telefone != '';

-- Verificar dados apos a atualizacao
SELECT 
    u.id,
    u.username as cpf,
    u.whatsapp as whatsapp_atualizado,
    t.nome,
    t.telefone as telefone_json
FROM users u
LEFT JOIN temp_funcionarios t ON u.username = t.cpf
WHERE t.cpf IS NOT NULL
ORDER BY u.id;

-- Mostrar estatisticas
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN whatsapp IS NOT NULL AND whatsapp != '' THEN 1 END) as com_whatsapp,
    COUNT(CASE WHEN whatsapp IS NULL OR whatsapp = '' THEN 1 END) as sem_whatsapp
FROM users;

-- Limpar tabela temporaria
DROP TABLE temp_funcionarios;
"@

# Salvar arquivo SQL
$sqlContent | Out-File -FilePath $sqlFile -Encoding UTF8
Write-Host "Arquivo SQL criado: $sqlFile" -ForegroundColor Green

# Mostrar estatisticas dos dados
Write-Host "`nESTATISTICAS DOS DADOS:" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Arquivo JSON: $jsonPath" -ForegroundColor White
Write-Host "Total de funcionarios: $($jsonData.total)" -ForegroundColor White
Write-Host "Com WhatsApp: $($jsonData.total)" -ForegroundColor White
Write-Host "Com email: $($jsonData.funcionarios.Where({$_.email}).Count)" -ForegroundColor White

# Mostrar amostra dos dados
Write-Host "`nAMOSTRA DOS DADOS:" -ForegroundColor Yellow
$jsonData.funcionarios | Select-Object -First 5 | Format-Table -AutoSize

Write-Host "`nPROXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Verifique o arquivo SQL: $sqlFile" -ForegroundColor Cyan
Write-Host "2. Execute o SQL no seu banco de dados" -ForegroundColor Cyan
Write-Host "3. Verifique se os CPFs correspondem corretamente" -ForegroundColor Cyan

Write-Host "`nIMPORTANTE:" -ForegroundColor Yellow
Write-Host "- O script so atualiza onde ha correspondencia exata de CPF" -ForegroundColor White
Write-Host "- Verifique os dados antes de executar" -ForegroundColor White
Write-Host "- Faca backup do banco antes de executar" -ForegroundColor White

Write-Host "`nSCRIPT GERADO COM SUCESSO!" -ForegroundColor Green 