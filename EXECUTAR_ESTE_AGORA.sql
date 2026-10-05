-- ⚠️ EXECUTAR ESTE SCRIPT NO DBEAVER AGORA ⚠️
-- Este script vai permitir que a V2 seja executada novamente

-- 1. LIMPAR O HISTÓRICO DO FLYWAY
-- Isso fará com que o Flyway execute novamente as migrations V2, V29, V139, V157, V261, V262, V263
DELETE FROM flyway_schema_history 
WHERE version IN ('2', '29', '139', '157', '261', '262', '263');

-- 2. VERIFICAR SE FOI REMOVIDO
SELECT version, description, installed_on, success 
FROM flyway_schema_history 
WHERE version IN ('2', '29', '139', '157', '261', '262', '263')
ORDER BY version;

-- Se a query acima não retornar nenhuma linha, PERFEITO! ✅
-- Se retornar alguma linha, execute novamente o DELETE acima.

-- ✅ DEPOIS DE EXECUTAR ESTE SCRIPT:
-- 1. Pare o backend (Ctrl+C no terminal)
-- 2. Reinicie o backend: java -jar backend/target/fluxbus-1.0.0.jar --spring.profiles.active=test
-- 
-- O Flyway vai:
-- ✅ Executar a V2 e criar a tabela positions (com base_salary)
-- ✅ Executar a V2 e criar a tabela employees (COMPLETA com todas as colunas)
-- ✅ Executar a V29 (que vai verificar que base_salary já existe e não fazer nada)
-- ✅ Executar a V139 (que vai verificar que as colunas já existem e não fazer nada)
-- ✅ Executar a V157 (que vai inserir dados de teste)
-- ✅ Backend vai iniciar com sucesso!

