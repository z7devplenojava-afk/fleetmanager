$sourcePath = "c:\dev\fleetmanager\frontend\src"

Get-ChildItem -Path $sourcePath -Recurse -Filter "*.*" | Where-Object { $_.Extension -match "\.(tsx|ts|html|css|json)$" } | ForEach-Object {
    $content = Get-Content -Path $_.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Specific long phrases first
    $content = $content -replace "Promover Vigilância - Sistema de Gestão 2025", "Fleet Manager - Sistema de Gestão"
    $content = $content -replace "FluxBus - Sistema de Segurança", "Fleet Manager - Sistema de Gestão"
    
    # General Brand Names
    $content = $content -replace "Promover Vigilância", "Fleet Manager"
    $content = $content -replace "FluxBus", "Fleet Manager"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $_.FullName -Value $content -Encoding UTF8
        Write-Host "Updated $($_.Name)"
    }
}
