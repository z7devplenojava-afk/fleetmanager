# Script Simples - Status dos Arquivos Unificados
# Secure Guard

Write-Host "=== STATUS DOS ARQUIVOS UNIFICADOS ===" -ForegroundColor Cyan

$baseDir = Get-Location
$unifiedDir = Join-Path $baseDir "uploads\unified"
$holeritesDir = Join-Path $unifiedDir "holerites"
$receiptsDir = Join-Path $unifiedDir "receipts"

if (!(Test-Path $unifiedDir)) {
    Write-Host "Pasta unificada nao encontrada!" -ForegroundColor Red
    exit
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

Write-Host "`nScript executado com sucesso!" -ForegroundColor Green
