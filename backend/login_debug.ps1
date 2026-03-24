$body = @{
    username = "jose.ramos"
    password = "FlexBus@2026"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8083/api/auth/login" -Method Post -Body $body -ContentType "application/json"
    Write-Host "Login Success!"
    Write-Host "200"
    $response | ConvertTo-Json
}
catch {
    Write-Host "Login Failed:"
    Write-Host $_.Exception.Response.StatusCode.value__
    $_.Exception.Response.GetResponseStream() | ForEach-Object {
        $reader = New-Object System.IO.StreamReader($_)
        $reader.ReadToEnd()
    }
}
