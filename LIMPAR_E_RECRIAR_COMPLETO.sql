-- Script completo para limpar e recriar todas as tabelas da migration V2
-- Execute este script no DBeaver/PgAdmin antes de iniciar o backend

-- 1. Remover o registro das migrations problemáticas do histórico do Flyway
DELETE FROM flyway_schema_history WHERE version IN ('2', '29', '139', '157', '261', '262', '263');

-- 2. Dropar TODAS as tabelas que a V2 cria (na ordem correta devido às foreign keys)
DROP TABLE IF EXISTS payroll_items CASCADE;
DROP TABLE IF EXISTS epis CASCADE;
DROP TABLE IF EXISTS payrolls CASCADE;
DROP TABLE IF EXISTS occurrences CASCADE;
DROP TABLE IF EXISTS scale_histories CASCADE;
DROP TABLE IF EXISTS benefits CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS units CASCADE;

-- IMPORTANTE: Também é necessário dropar a tabela positions porque ela precisa ser recriada com a coluna base_salary

-- 3. Remover os triggers se existirem
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
DROP TRIGGER IF EXISTS update_benefits_updated_at ON benefits;
DROP TRIGGER IF EXISTS update_scale_histories_updated_at ON scale_histories;
DROP TRIGGER IF EXISTS update_occurrences_updated_at ON occurrences;
DROP TRIGGER IF EXISTS update_payrolls_updated_at ON payrolls;
DROP TRIGGER IF EXISTS update_epis_updated_at ON epis;
DROP TRIGGER IF EXISTS update_positions_updated_at ON positions;
DROP TRIGGER IF EXISTS update_units_updated_at ON units;

-- 4. Remover a função se existir
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 5. Verificar se tudo foi removido
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('units', 'positions', 'employees', 'documents', 'benefits', 
                  'scale_histories', 'occurrences', 'payrolls', 'epis', 'payroll_items');

-- 6. Verificar o histórico do Flyway
SELECT version, description, installed_on, success 
FROM flyway_schema_history 
WHERE version IN ('2', '263')
ORDER BY installed_rank DESC;

-- ✅ Após executar este script:
-- - Recompile o backend: .\mvnw.cmd clean package -DskipTests
-- - Reinicie o backend: java -jar backend/target/secured-guard-1.0.0.jar --spring.profiles.active=test
-- 
-- A migration V2 será executada novamente e criará:
-- ✅ Tabela employees COMPLETA com todas as 70+ colunas
-- ✅ Coluna company_id com foreign key
-- ✅ Todos os índices necessários
-- ✅ Todas as outras tabelas do RH

