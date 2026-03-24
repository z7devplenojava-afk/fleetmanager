$sourcePath = "c:\dev\fleetmanager\backend\src\main\java"

Get-ChildItem -Path $sourcePath -Recurse -Filter "*.java" | ForEach-Object {
    $content = Get-Content -Path $_.FullName -Raw
    
    # Replace package/import component
    $newContent = $content -replace "com.z7design.secured_guard", "com.z7design.fleet_manager"
    
    # Replace main class name if present
    $newContent = $newContent -replace "SecuredGuardApplication", "FleetManagerApplication"
    
    if ($content -ne $newContent) {
        Set-Content -Path $_.FullName -Value $newContent -Encoding UTF8
        Write-Host "Updated $($_.Name)"
    }
}
