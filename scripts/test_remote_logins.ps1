$targets = @(
    @{ Name = "CI"; Url = "https://ci.fluxbus.com.br/api/auth/login" },
    @{ Name = "DEV"; Url = "https://dev.fluxbus.com.br/api/auth/login" },
    @{ Name = "DEV-API"; Url = "https://api.dev.fluxbus.com.br/api/auth/login" },
    @{ Name = "PROD"; Url = "https://fluxbus.com.br/api/auth/login" },
    @{ Name = "PROD-API"; Url = "https://api.fluxbus.com.br/api/auth/login" }
)

$body = @{
    username = "jose.ramos"
    password = "FluxBus@2026"
} | ConvertTo-Json

foreach ($target in $targets) {
    Write-Host "=== Testando $($target.Name) ($($target.Url)) ==="
    try {
        $response = Invoke-RestMethod -Uri $target.Url -Method POST -Body $body -ContentType "application/json" -TimeoutSec 10
        Write-Host "SUCCESS em $($target.Name)!"
        Write-Host "Token: $($response.token.Substring(0, 20))..."
        Write-Host "User: $($response.user.username)"
    } catch {
        Write-Host "FALHA em $($target.Name):"
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            Write-Host "Status Code: $statusCode ($($_.Exception.Response.StatusDescription))"
        } else {
            Write-Host "Erro: $($_.Exception.Message)"
        }
    }
}
