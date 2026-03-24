-- Verificação do banco: fleetmanager_test
-- Conexão padrão (application-local.properties):
--   Host: localhost:5432
--   Database: fleetmanager_test
--   User: postgres
--   Senha: conforme SPRING_DATASOURCE_PASSWORD (padrão no repo: 1234567)
--
-- Exemplo (PowerShell, se psql estiver no PATH):
--   $env:PGPASSWORD='1234567'
--   psql -h localhost -p 5432 -U postgres -d fleetmanager_test -f backend/scripts/verify_fleetmanager_test.sql

-- 1) Últimas migrations Flyway aplicadas
SELECT installed_rank, version, description, success, installed_on
FROM flyway_schema_history
ORDER BY installed_rank DESC
LIMIT 15;

-- 2) Usuários com papel SUPER_ADMIN (login usa username + senha no banco)
SELECT u.id, u.username, u.email, u.active, u.status, r.name AS role_name
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
WHERE r.name = 'SUPER_ADMIN'
ORDER BY u.username;

-- 3) Usuários seed comuns (ajuste o LIKE se precisar)
SELECT username, email, active, status
FROM users
WHERE username IN ('superadmin', 'jose.ramos')
   OR email ILIKE '%superadmin%'
   OR email ILIKE '%jose.ramos%';

-- 4) Contagem de usuários por papel
SELECT r.name, COUNT(*) AS qtd
FROM user_roles ur
JOIN roles r ON r.id = ur.role_id
GROUP BY r.name
ORDER BY qtd DESC;
