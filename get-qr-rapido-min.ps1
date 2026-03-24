Write-Host "Getting WhatsApp QR..."

$attempts = 20
$ok = $false

for ($i = 1; $i -le $attempts; $i++) {
    Write-Host "[$i/$attempts] Trying..." -NoNewline
    try {
        Invoke-WebRequest -Uri "http://localhost:3333/instance/qr" -OutFile "qrcode-atual.svg" -ErrorAction Stop -TimeoutSec 3 | Out-Null
        if (Test-Path "qrcode-atual.svg") {
            $size = (Get-Item "qrcode-atual.svg").Length
            if ($size -gt 100) { Write-Host " OK"; $ok = $true; break }
        }
        Write-Host " waiting"
    } catch { Write-Host " waiting" }
    Start-Sleep -Seconds 2
}

if ($ok) {
    Write-Host "QR saved: qrcode-atual.svg"
    Start-Process "qrcode-atual.svg"
} else {
    Write-Host "QR not available yet. Try again."
}


