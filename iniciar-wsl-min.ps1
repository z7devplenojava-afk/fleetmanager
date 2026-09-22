Write-Host "FLUXBUS - WSL Ubuntu"
Write-Host "----------------------------------------"

# 1. Start Docker in WSL (as root)
Write-Host "1) Starting Docker in WSL..."
wsl -d Ubuntu-22.04 -u root bash -c "service docker start >/dev/null 2>&1 || systemctl start docker >/dev/null 2>&1 || (nohup dockerd >/dev/null 2>&1 &)"
$dockerOk = wsl -d Ubuntu-22.04 bash -c "docker info >/dev/null 2>&1 && echo OK || echo FAIL"
if ($dockerOk -ne "OK") {
    Write-Host "Docker could not start in WSL. Open Ubuntu and run: sudo service docker start"
    exit 1
}

# 2. Prepare project files inside WSL
Write-Host "2) Preparing project files..."
wsl -d Ubuntu-22.04 bash -c "mkdir -p ~/fluxbus"
wsl -d Ubuntu-22.04 bash -c "cp /mnt/c/dev/fluxbus/docker-compose.yml ~/fluxbus/"
wsl -d Ubuntu-22.04 bash -c "cp -r /mnt/c/dev/fluxbus/whatsapp-service ~/fluxbus/ 2>/dev/null || true"
wsl -d Ubuntu-22.04 bash -c "mkdir -p ~/fluxbus/backend/holerites/9-2025"

# 3. Create network
Write-Host "3) Creating Docker network..."
wsl -d Ubuntu-22.04 bash -c "cd ~/fluxbus; docker network create fluxbus 2>/dev/null || echo 'network ok'"

# 4. Restart stack
Write-Host "4) Restarting containers..."
wsl -d Ubuntu-22.04 bash -c "cd ~/fluxbus; docker compose down 2>/dev/null || true"
wsl -d Ubuntu-22.04 bash -c "cd ~/fluxbus; docker compose up -d"

# 5. Show status
Write-Host "5) Containers status:"
wsl -d Ubuntu-22.04 bash -c "cd ~/fluxbus; docker ps --format '{{.Names}} - {{.Status}}'"

Write-Host "----------------------------------------"
Write-Host "Next: run .\\get-qr-rapido.ps1 to fetch the QR code"
Write-Host "WhatsApp API: http://localhost:3333"
Write-Host "PostgreSQL:   localhost:5433"
Write-Host "Redis:        localhost:6379"
Write-Host "----------------------------------------"



