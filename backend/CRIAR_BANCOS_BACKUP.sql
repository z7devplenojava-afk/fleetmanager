-- =====================================================
-- CRIAR BANCOS DE BACKUP
-- =====================================================
-- Execute no PostgreSQL LOCAL e na VPS
-- =====================================================

-- 1️⃣ BANCO LOCAL (Execute no servidor principal)
-- =====================================================

-- Conectar como postgres
-- psql -U postgres

-- Criar banco de backup local
CREATE DATABASE secured_guard_backup
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'pt_BR.UTF-8'
    LC_CTYPE = 'pt_BR.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

COMMENT ON DATABASE secured_guard_backup IS 'Banco de backup local do SecuredGuard';

-- Conectar no banco de backup
\c secured_guard_backup

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Pronto! Backup local configurado ✅

-- =====================================================

-- 2️⃣ BANCO NA VPS (Execute na VPS via SSH)
-- =====================================================

-- SSH na VPS:
-- ssh usuario@IP_DA_VPS
-- psql -U postgres

-- Criar banco de backup na VPS
CREATE DATABASE vps_secured_guard_backup
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'pt_BR.UTF-8'
    LC_CTYPE = 'pt_BR.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

COMMENT ON DATABASE vps_secured_guard_backup IS 'Banco de backup remoto (VPS) do SecuredGuard';

-- Conectar no banco de backup
\c vps_secured_guard_backup

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Pronto! Backup VPS configurado ✅

-- =====================================================

-- 3️⃣ VERIFICAÇÃO
-- =====================================================

-- No servidor LOCAL:
SELECT datname, pg_size_pretty(pg_database_size(datname)) as tamanho
FROM pg_database
WHERE datname LIKE '%backup%';

-- Resultado esperado:
-- secured_guard_backup | 8192 bytes

-- Na VPS (via SSH):
SELECT datname, pg_size_pretty(pg_database_size(datname)) as tamanho
FROM pg_database
WHERE datname LIKE '%backup%';

-- Resultado esperado:
-- vps_secured_guard_backup | 8192 bytes

-- =====================================================

-- 4️⃣ CONFIGURAR FIREWALL NA VPS
-- =====================================================

-- Permitir conexões PostgreSQL do servidor principal
-- Execute no terminal da VPS:

-- sudo ufw allow from IP_DO_SERVIDOR_PRINCIPAL to any port 5432

-- Ou editar pg_hba.conf:
-- sudo nano /etc/postgresql/17/main/pg_hba.conf

-- Adicionar linha:
-- host    all             all             IP_DO_SERVIDOR_PRINCIPAL/32    md5

-- Reiniciar PostgreSQL:
-- sudo systemctl restart postgresql

-- =====================================================

-- 5️⃣ TESTE DE CONEXÃO
-- =====================================================

-- Do servidor principal, testar conexão com VPS:
-- psql -h IP_DA_VPS -p 5432 -U postgres -d vps_secured_guard_backup

-- Se conectar com sucesso: ✅ VPS configurada!

-- =====================================================
-- BANCOS PRONTOS PARA RECEBER BACKUPS!
-- =====================================================

