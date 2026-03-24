# Script para compilar o backend sem problemas de espaços no caminho
Write-Host "🔨 Compilando backend..." -ForegroundColor Yellow

try {
    # Mudar para o diretório backend
    Set-Location -Path "backend"
    
    # Executar o Maven wrapper com caminho completo
    & ".\mvnw.cmd" clean compile -DskipTests
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Compilação concluída com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro na compilação!" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Voltar para o diretório raiz
    Set-Location -Path ".."
}

Write-Host "Pressione qualquer tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
