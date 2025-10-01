# PowerShell script to fix all import errors in Java files
$javaFiles = Get-ChildItem -Path "src\main\java" -Filter "*.java" -Recurse
$fixedCount = 0
$totalCount = $javaFiles.Count

Write-Host "Found $totalCount Java files to process..."

foreach ($file in $javaFiles) {
    try {
        $content = Get-Content $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        
        # Fix package declarations
        $content = $content -replace 'package com\.z7design\.secured_guard\.([^;]+);', 'package br.com.fleetmanager.$1;'
        
        # Fix import statements
        $content = $content -replace 'import com\.z7design\.secured_guard\.([^;]+);', 'import br.com.fleetmanager.$1;'
        
        # Only write if changes were made
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -NoNewline -Encoding UTF8
            Write-Host "Fixed: $($file.Name)"
            $fixedCount++
        }
    }
    catch {
        Write-Host "Error processing $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nCompleted! Fixed $fixedCount out of $totalCount files." -ForegroundColor Green
