# PowerShell - Diagnóstico Remoto Simplificado
# Execute este script para diagnosticar o erro 500 remotamente

param(
    [Parameter(Mandatory = $true)]
    [string]$ServerUser,
    
    [string]$ServerHost = "ci.z7botsolutions.com.br"
)

Write-Host "=== DIAGNÓSTICO ERRO 500 - CI ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Verificando logs do backend..." -ForegroundColor Yellow
Write-Host ""

# Executar comando remoto para ver logs
ssh "${ServerUser}@${ServerHost}" @"
echo '=== LOGS DO BACKEND (últimas 100 linhas com erros) ==='
docker logs fluxbus-backend-ci --tail 100 2>&1 | grep -E 'ERROR|Exception|login|authenticate'

echo ''
echo '=== USUÁRIOS SEM ROLES ==='
docker exec fluxbus-postgres-ci psql -U fluxbus_user -d fluxbus -c \"
SELECT u.username, u.email, COUNT(ur.role_id) as total_roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
GROUP BY u.username, u.email
HAVING COUNT(ur.role_id) = 0
LIMIT 10;\"
"@

Write-Host ""
Write-Host "=== FIM DO DIAGNÓSTICO ===" -ForegroundColor Cyan
Write-Host ""

$aplicar = Read-Host "Deseja aplicar a correção SQL? (S/N)"

if ($aplicar -eq "S" -or $aplicar -eq "s") {
    Write-Host ""
    Write-Host "Aplicando correção..." -ForegroundColor Yellow
    
    ssh "${ServerUser}@${ServerHost}" @"
docker exec -i fluxbus-postgres-ci psql -U fluxbus_user -d fluxbus << 'EOF'
BEGIN;
INSERT INTO roles (id, name, description, created_at)
VALUES (gen_random_uuid(), 'COLABORADOR', 'Funcionário colaborador', NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE r.name = 'COLABORADOR'
  AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id);
COMMIT;
EOF
"@
    
    Write-Host ""
    Write-Host "✅ Correção aplicada!" -ForegroundColor Green
    Write-Host "Teste o login agora em: https://ci.z7botsolutions.com.br" -ForegroundColor Cyan
}
