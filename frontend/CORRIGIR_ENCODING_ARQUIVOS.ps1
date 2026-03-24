# PowerShell Script para Corrigir Encoding UTF-8
# Uso: .\CORRIGIR_ENCODING_ARQUIVOS.ps1

Write-Host "🔧 Corrigindo encoding de arquivos TypeScript/React..." -ForegroundColor Cyan

# Definir encoding UTF-8 sem BOM
$utf8NoBOM = New-Object System.Text.UTF8Encoding $false

# Mapa de caracteres corrompidos → corretos
$replacements = @{
    'Ã£Ã£' = 'çõ'
    'Ã£o' = 'ão'
    'Ã§Ã£' = 'çã'  
    'Ã£' = 'ã'
    'Ã§' = 'ç'
    'Ã©' = 'é'
    'Ã³' = 'ó'
    'Ãª' = 'ê'
    'Ã¡' = 'á'
    'Ã­' = 'í'
    'Ãº' = 'ú'
    'Ã´' = 'ô'
    'Ã¢' = 'â'
    'Ã¼' = 'ü'
    'Ã' = 'À'
    'Ã€' = 'À'
}

# Contar arquivos processados
$count = 0
$fixed = 0

# Processar todos os arquivos .tsx e .ts
Get-ChildItem -Path "src" -Recurse -Include *.tsx,*.ts -File | ForEach-Object {
    $file = $_.FullName
    $count++
    
    Write-Host "📄 Processando: $($_.Name)" -NoNewline
    
    try {
        # Ler conteúdo preservando encoding
        $content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
        $originalContent = $content
        
        # Aplicar todas as substituições
        foreach ($key in $replacements.Keys) {
            if ($content.Contains($key)) {
                $content = $content.Replace($key, $replacements[$key])
                $fixed++
            }
        }
        
        # Salvar apenas se houv alguma mudança
        if ($content -ne $originalContent) {
            [System.IO.File]::WriteAllText($file, $content, $utf8NoBOM)
            Write-Host " ✅ Corrigido" -ForegroundColor Green
        } else {
            Write-Host " ⏭️ OK" -ForegroundColor Gray
        }
        
    } catch {
        Write-Host " ❌ Erro: $_" -ForegroundColor Red
    }
}

Write-Host "`n✅ Processamento concluído!" -ForegroundColor Green
Write-Host "📊 Total de arquivos: $count" -ForegroundColor Cyan
Write-Host "🔧 Arquivos corrigidos: $fixed" -ForegroundColor Yellow
Write-Host "`n💡 Próximo passo: npm run build" -ForegroundColor Magenta

