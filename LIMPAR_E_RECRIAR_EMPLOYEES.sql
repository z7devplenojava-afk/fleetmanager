-- Script para limpar o histórico do Flyway e permitir que a V2 seja executada novamente
-- Execute este script no DBeaver/PgAdmin antes de iniciar o backend

-- 1. Remover o registro da V2 do histórico do Flyway
DELETE FROM flyway_schema_history WHERE version = '2';

-- 2. Remover também a V263 que está falhando
DELETE FROM flyway_schema_history WHERE version = '263';

-- 3. Verificar se a tabela employees existe e deletá-la se existir
DROP TABLE IF EXISTS employees CASCADE;

-- 4. Verificar o estado atual
SELECT version, description, installed_on, success 
FROM flyway_schema_history 
WHERE version IN ('2', '263')
ORDER BY installed_rank DESC;

-- ✅ Após executar este script, reinicie o backend
-- A migration V2 será executada novamente e criará a tabela employees com TODAS as colunas

