# PowerShell script to rename migration files from V999+ sequence to V505+ sequence
$migrationDir = "src\main\resources\db\migration"

# Define the mapping of old version numbers to new version numbers
$versionMap = @{
    "V999" = "V505"
    "V1002" = "V506"
    "V1003" = "V507"
    "V1004" = "V508"
    "V1005" = "V509"
    "V1006" = "V510"
    "V1007" = "V511"
    "V1008" = "V512"
    "V1009" = "V513"
    "V1010" = "V514"
    "V1011" = "V515"
    "V1012" = "V516"
    "V1013" = "V517"
    "V1015" = "V518"
    "V1016" = "V519"
    "V1017" = "V520"
    "V1018" = "V521"
    "V1019" = "V522"
    "V1020" = "V523"
    "V1021" = "V524"
}

Write-Host "Renaming migration files..." -ForegroundColor Green

$renamedCount = 0

foreach ($oldVersion in $versionMap.Keys) {
    $newVersion = $versionMap[$oldVersion]
    
    # Find files that start with the old version
    $files = Get-ChildItem -Path $migrationDir -Filter "$oldVersion*.sql"
    
    foreach ($file in $files) {
        $oldName = $file.Name
        $newName = $oldName -replace "^$oldVersion", $newVersion
        $oldPath = $file.FullName
        $newPath = Join-Path $migrationDir $newName
        
        try {
            Rename-Item -Path $oldPath -NewName $newName
            Write-Host "Renamed: $oldName -> $newName" -ForegroundColor Yellow
            $renamedCount++
        }
        catch {
            Write-Host "Error renaming $oldName : $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "`nCompleted! Renamed $renamedCount migration files." -ForegroundColor Green

# List all migration files to verify the new sequence
Write-Host "`nCurrent migration files:" -ForegroundColor Cyan
Get-ChildItem -Path $migrationDir -Filter "V*.sql" | Sort-Object Name | ForEach-Object {
    Write-Host "  $($_.Name)" -ForegroundColor White
}
