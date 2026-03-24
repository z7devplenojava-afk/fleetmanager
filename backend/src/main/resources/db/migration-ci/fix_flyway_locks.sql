-- =====================================================
-- SCRIPT PARA LIBERAR LOCKS ÓRFÃOS DO FLYWAY
-- Execute este script no banco de dados CI se o Flyway
-- estiver travado tentando obter locks
-- =====================================================

-- Liberar todos os advisory locks do Flyway
-- O Flyway usa advisory locks do PostgreSQL para garantir
-- que apenas uma instância execute migrations por vez
SELECT pg_advisory_unlock_all();

-- Verificar se há locks ativos
SELECT 
    locktype,
    database,
    relation::regclass,
    mode,
    granted
FROM pg_locks
WHERE locktype = 'advisory';

-- Verificar processos do Flyway travados
SELECT 
    pid,
    usename,
    application_name,
    state,
    wait_event_type,
    wait_event,
    query_start,
    state_change
FROM pg_stat_activity
WHERE application_name LIKE '%Flyway%' OR query LIKE '%flyway%';














