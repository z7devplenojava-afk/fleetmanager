# Script de Gerenciamento de Arquivos Unificados - Secure Guard
# Autor: Sistema Secure Guard
# Data: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")

param(
    [string]$Action = "status",
    [string]$SearchTerm = "",
    [string]$Type = "all"
)

# Definir caminhos
$baseDir = Get-Location
$unifiedDir = Join-Path $baseDir "uploads\unified"
$holeritesDir = Join-Path $unifiedDir "holerites"
$receiptsDir = Join-Path $unifiedDir "receipts"

# Funcao para mostrar status geral
function Show-Status {
    Write-Host "`n=== STATUS DOS ARQUIVOS UNIFICADOS ===" -ForegroundColor Cyan
    
    if (!(Test-Path $unifiedDir)) {
        Write-Host "Pasta unificada nao encontrada!" -ForegroundColor Red
        return
    }
    
    $holeritesCount = 0
    $receiptsCount = 0
    
    if (Test-Path $holeritesDir) {
        $holeritesCount = (Get-ChildItem -Path $holeritesDir -File -Filter "*.pdf").Count
    }
    
    if (Test-Path $receiptsDir) {
        $receiptsCount = (Get-ChildItem -Path $receiptsDir -File -Filter "*.pdf").Count
    }
    
    $total = $holeritesCount + $receiptsCount
    
    Write-Host "Pasta unificada: $unifiedDir" -ForegroundColor Yellow
    Write-Host "Total de arquivos: $total" -ForegroundColor Green
    Write-Host "   ├── Holerites: $holeritesCount arquivos" -ForegroundColor Blue
    Write-Host "   └── Recibos: $receiptsCount arquivos" -ForegroundColor Blue
    
    if (Test-Path (Join-Path $unifiedDir "relatorio_unificacao.txt")) {
        Write-Host "Relatorio disponivel: relatorio_unificacao.txt" -ForegroundColor Gray
    }
}

# Funcao para listar arquivos por tipo
function Show-FilesByType {
    param([string]$FileType)
    
    Write-Host "`n=== LISTANDO $($FileType.ToUpper()) ===" -ForegroundColor Cyan
    
    if ($FileType -eq "holerites" -or $FileType -eq "all") {
        if (Test-Path $holeritesDir) {
            $files = Get-ChildItem -Path $holeritesDir -File -Filter "*.pdf" | Sort-Object Name
            Write-Host "`nHOLERITES - $($files.Count) arquivos:" -ForegroundColor Magenta
            foreach ($file in $files) {
                Write-Host "   - $($file.Name)" -ForegroundColor White
            }
        }
    }
    
    if ($FileType -eq "receipts" -or $FileType -eq "all") {
        if (Test-Path $receiptsDir) {
            $files = Get-ChildItem -Path $receiptsDir -File -Filter "*.pdf" | Sort-Object Name
            Write-Host "`nRECIBOS - $($files.Count) arquivos:" -ForegroundColor Magenta
            foreach ($file in $files) {
                Write-Host "   - $($file.Name)" -ForegroundColor White
            }
        }
    }
}

# Funcao para buscar arquivos
function Search-Files {
    param([string]$SearchTerm)
    
    Write-Host "`n=== BUSCANDO: '$SearchTerm' ===" -ForegroundColor Cyan
    
    $results = @()
    
    # Buscar em holerites
    if (Test-Path $holeritesDir) {
        $holeritesResults = Get-ChildItem -Path $holeritesDir -File -Filter "*.pdf" | Where-Object { $_.Name -like "*$SearchTerm*" }
        $results += $holeritesResults | ForEach-Object { [PSCustomObject]@{Type="Holerite"; File=$_} }
    }
    
    # Buscar em recibos
    if (Test-Path $receiptsDir) {
        $receiptsResults = Get-ChildItem -Path $receiptsDir -File -Filter "*.pdf" | Where-Object { $_.Name -like "*$SearchTerm*" }
        $results += $receiptsResults | ForEach-Object { [PSCustomObject]@{Type="Recibo"; File=$_} }
    }
    
    if ($results.Count -eq 0) {
        Write-Host "Nenhum arquivo encontrado com o termo: $SearchTerm" -ForegroundColor Red
        return
    }
    
    Write-Host "Encontrados $($results.Count) arquivos:" -ForegroundColor Green
    foreach ($result in $results) {
        Write-Host "   - [$($result.Type)] $($result.File.Name)" -ForegroundColor White
    }
}

# Funcao para mostrar estatisticas
function Show-Statistics {
    Write-Host "`n=== ESTATISTICAS DETALHADAS ===" -ForegroundColor Cyan
    
    $stats = @{}
    
    # Estatisticas de holerites
    if (Test-Path $holeritesDir) {
        $holeritesFiles = Get-ChildItem -Path $holeritesDir -File -Filter "*.pdf"
        $stats.Holerites = @{
            Total = $holeritesFiles.Count
            Size = ($holeritesFiles | Measure-Object -Property Length -Sum).Sum
            Period = "6-2025"
        }
    }
    
    # Estatisticas de recibos
    if (Test-Path $receiptsDir) {
        $receiptsFiles = Get-ChildItem -Path $receiptsDir -File -Filter "*.pdf"
        $stats.Receipts = @{
            Total = $receiptsFiles.Count
            Size = ($receiptsFiles | Measure-Object -Property Length -Sum).Sum
            Period = "07_2025"
        }
    }
    
    # Calcular totais
    $totalFiles = ($stats.Holerites.Total + $stats.Receipts.Total)
    $totalSize = ($stats.Holerites.Size + $stats.Receipts.Size)
    
    Write-Host "RESUMO GERAL:" -ForegroundColor Yellow
    Write-Host "   Total de arquivos: $totalFiles" -ForegroundColor White
    Write-Host "   Tamanho total: $([math]::Round($totalSize/1KB, 2)) KB" -ForegroundColor White
    
    Write-Host "`nHOLERITES:" -ForegroundColor Blue
    Write-Host "   Quantidade: $($stats.Holerites.Total)" -ForegroundColor White
    Write-Host "   Tamanho: $([math]::Round($stats.Holerites.Size/1KB, 2)) KB" -ForegroundColor White
    Write-Host "   Periodo: $($stats.Holerites.Period)" -ForegroundColor White
    
    Write-Host "`nRECIBOS:" -ForegroundColor Blue
    Write-Host "   Quantidade: $($stats.Receipts.Total)" -ForegroundColor White
    Write-Host "   Tamanho: $([math]::Round($stats.Receipts.Size/1KB, 2)) KB" -ForegroundColor White
    Write-Host "   Periodo: $($stats.Receipts.Period)" -ForegroundColor White
}

# Funcao para mostrar ajuda
function Show-Help {
    Write-Host "`n=== AJUDA - GERENCIADOR DE ARQUIVOS UNIFICADOS ===" -ForegroundColor Cyan
    Write-Host "`nUso:" -ForegroundColor Yellow
    Write-Host "   .\manage-unified-files.ps1 [acao] [parametros]" -ForegroundColor White
    
    Write-Host "`nAcoes disponiveis:" -ForegroundColor Yellow
    Write-Host "   status     - Mostra status geral dos arquivos" -ForegroundColor White
    Write-Host "   list       - Lista todos os arquivos" -ForegroundColor White
    Write-Host "   holerites  - Lista apenas holerites" -ForegroundColor White
    Write-Host "   receipts   - Lista apenas recibos" -ForegroundColor White
    Write-Host "   search     - Busca arquivos por termo" -ForegroundColor White
    Write-Host "   stats      - Mostra estatisticas detalhadas" -ForegroundColor White
    Write-Host "   help       - Mostra esta ajuda" -ForegroundColor White
    
    Write-Host "`nExemplos:" -ForegroundColor Yellow
    Write-Host "   .\manage-unified-files.ps1 status" -ForegroundColor White
    Write-Host "   .\manage-unified-files.ps1 list" -ForegroundColor White
    Write-Host "   .\manage-unified-files.ps1 search 'silva'" -ForegroundColor White
    Write-Host "   .\manage-unified-files.ps1 stats" -ForegroundColor White
}

# Executar acao baseada no parametro
switch ($Action.ToLower()) {
    "status" { Show-Status }
    "list" { Show-FilesByType -FileType "all" }
    "holerites" { Show-FilesByType -FileType "holerites" }
    "receipts" { Show-FilesByType -FileType "receipts" }
    "search" { 
        if ($SearchTerm) {
            Search-Files -SearchTerm $SearchTerm
        } else {
            Write-Host "Termo de busca nao especificado!" -ForegroundColor Red
            Write-Host "Use: .\manage-unified-files.ps1 search 'termo'" -ForegroundColor Yellow
        }
    }
    "stats" { Show-Statistics }
    "help" { Show-Help }
    default { 
        Write-Host "Acao '$Action' nao reconhecida!" -ForegroundColor Red
        Show-Help
    }
}

Write-Host "`nScript executado com sucesso!" -ForegroundColor Green
