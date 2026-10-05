-- Execute este script no banco fluxbus_test para limpar a migração V307

-- 1. Deletar registro da migração V307 do histórico do Flyway
DELETE FROM flyway_schema_history WHERE version = '307';

-- 2. Verificar se as colunas já existem e remover (caso tenham sido criadas parcialmente)
ALTER TABLE activity_reports DROP COLUMN IF EXISTS ballistic_plate_number;
ALTER TABLE activity_reports DROP COLUMN IF EXISTS ballistic_plate_valid_until;

-- 3. Verificar histórico do Flyway
SELECT version, description, installed_on, success 
FROM flyway_schema_history 
ORDER BY installed_rank DESC 
LIMIT 10;

