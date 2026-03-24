# Script para Unificar Arquivos Processados - Holerites e Recibos
# Autor: Sistema Secure Guard
# Data: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")

Write-Host "Iniciando unificacao de arquivos processados..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Definir caminhos base - usar diretorio atual
$baseDir = Get-Location
$holeritesDir = Join-Path $baseDir "backend\holerites"
$receiptsDir = Join-Path $baseDir "uploads\receipts"
$unifiedDir = Join-Path $baseDir "uploads\unified"

Write-Host "Diretorio base: $baseDir" -ForegroundColor Gray
Write-Host "Pasta holerites: $holeritesDir" -ForegroundColor Gray
Write-Host "Pasta recibos: $receiptsDir" -ForegroundColor Gray
Write-Host "Pasta unificada: $unifiedDir" -ForegroundColor Gray

# Criar pasta unificada se nao existir
if (!(Test-Path $unifiedDir)) {
    New-Item -ItemType Directory -Path $unifiedDir -Force | Out-Null
    Write-Host "Pasta unificada criada: $unifiedDir" -ForegroundColor Green
}

# Funcao para contar arquivos em uma pasta
function Count-Files {
    param([string]$Path, [string]$Type)
    
    if (Test-Path $Path) {
        $files = Get-ChildItem -Path $Path -Recurse -File -Filter "*.pdf"
        $count = $files.Count
        Write-Host "$Type - $count arquivos encontrados em $Path" -ForegroundColor Yellow
        return $files
    } else {
        Write-Host "Pasta nao encontrada: $Path" -ForegroundColor Red
        return @()
    }
}

# Funcao para copiar arquivos com prefixo
function Copy-FilesWithPrefix {
    param([array]$Files, [string]$SourcePath, [string]$Prefix, [string]$TargetPath)
    
    $copiedCount = 0
    foreach ($file in $Files) {
        $newName = "$Prefix`_$($file.Name)"
        $targetFile = Join-Path $TargetPath $newName
        
        try {
            Copy-Item -Path $file.FullName -Destination $targetFile -Force
            $copiedCount++
            Write-Host "  Copiado: $($file.Name) -> $newName" -ForegroundColor Gray
        } catch {
            Write-Host "  Erro ao copiar: $($file.Name)" -ForegroundColor Red
        }
    }
    return $copiedCount
}

# Contar e processar Holerites
Write-Host "`nPROCESSANDO HOLERITES:" -ForegroundColor Magenta
$holeritesFiles = Count-Files -Path $holeritesDir -Type "Holerites"

if ($holeritesFiles.Count -gt 0) {
    # Criar subpasta para holerites
    $holeritesUnifiedDir = Join-Path $unifiedDir "holerites"
    if (!(Test-Path $holeritesUnifiedDir)) {
        New-Item -ItemType Directory -Path $holeritesUnifiedDir -Force | Out-Null
    }
    
    $holeritesCopied = Copy-FilesWithPrefix -Files $holeritesFiles -SourcePath $holeritesDir -Prefix "HOLERITE" -TargetPath $holeritesUnifiedDir
    Write-Host "Holerites copiados: $holeritesCopied de $($holeritesFiles.Count)" -ForegroundColor Green
}

# Contar e processar Recibos
Write-Host "`nPROCESSANDO RECIBOS:" -ForegroundColor Magenta
$receiptsFiles = Count-Files -Path $receiptsDir -Type "Recibos"

if ($receiptsFiles.Count -gt 0) {
    # Criar subpasta para recibos
    $receiptsUnifiedDir = Join-Path $unifiedDir "receipts"
    if (!(Test-Path $receiptsUnifiedDir)) {
        New-Item -ItemType Directory -Path $receiptsUnifiedDir -Force | Out-Null
    }
    
    $receiptsCopied = Copy-FilesWithPrefix -Files $receiptsFiles -SourcePath $receiptsDir -Prefix "RECIBO" -TargetPath $receiptsUnifiedDir
    Write-Host "Recibos copiados: $receiptsCopied de $($receiptsFiles.Count)" -ForegroundColor Green
}

# Criar relatorio de unificacao
$reportFile = Join-Path $unifiedDir "relatorio_unificacao.txt"
$reportContent = @"
RELATORIO DE UNIFICACAO DE ARQUIVOS PROCESSADOS
===============================================
Data: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")
Sistema: Secure Guard

RESUMO:
-------
Holerites: $($holeritesFiles.Count) arquivos processados
Recibos: $($receiptsFiles.Count) arquivos processados
Total: $($holeritesFiles.Count + $receiptsFiles.Count) arquivos

DETALHES:
----------
1. HOLERITES (Periodo: 6-2025)
   - Origem: $holeritesDir
   - Destino: $unifiedDir\holerites\
   - Arquivos copiados: $holeritesCopied

2. RECIBOS (Periodo: 07_2025)
   - Origem: $receiptsDir
   - Destino: $unifiedDir\receipts\
   - Arquivos copiados: $receiptsCopied

ESTRUTURA FINAL:
----------------
$unifiedDir\
├── holerites\
│   └── [$($holeritesFiles.Count) arquivos com prefixo HOLERITE_]
└── receipts\
    └── [$($receiptsFiles.Count) arquivos com prefixo RECIBO_]

STATUS: Unificacao concluida com sucesso!
"@

$reportContent | Out-File -FilePath $reportFile -Encoding UTF8
Write-Host "`nRelatorio salvo em: $reportFile" -ForegroundColor Cyan

# Mostrar estrutura final
Write-Host "`nESTRUTURA FINAL CRIADA:" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Get-ChildItem -Path $unifiedDir -Recurse -Directory | ForEach-Object {
    $files = Get-ChildItem -Path $_.FullName -File -Filter "*.pdf"
    Write-Host "$($_.Name): $($files.Count) arquivos" -ForegroundColor White
}

Write-Host "`nUNIFICACAO CONCLUIDA COM SUCESSO!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host "Pasta unificada: $unifiedDir" -ForegroundColor Yellow
Write-Host "Total de arquivos unificados: $($holeritesFiles.Count + $receiptsFiles.Count)" -ForegroundColor Yellow
Write-Host "Relatorio: $reportFile" -ForegroundColor Yellow
