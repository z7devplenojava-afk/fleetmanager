-- =====================================================
-- RESETAR MIGRAÇÕES V226, V227, V228 
-- Execute este script NO DBEAVER AGORA
-- =====================================================

BEGIN;

-- 1. Remover as migrações do histórico do Flyway
DELETE FROM flyway_schema_history WHERE version IN ('226', '227', '228');

-- 2. Apagar as tabelas para recriar corretamente
DROP TABLE IF EXISTS vehicle_maintenances CASCADE;
DROP TABLE IF EXISTS mileage_records CASCADE;
DROP TABLE IF EXISTS fines CASCADE;
DROP TABLE IF EXISTS fuel_records CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;

-- 3. Verificar remoção
SELECT 
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM flyway_schema_history WHERE version IN ('226', '227', '228'))
        THEN '✅ Migrações V226, V227, V228 removidas do histórico'
        ELSE '❌ Erro ao remover'
    END as status_historico;

SELECT 
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_maintenances')
        THEN '✅ Tabelas apagadas - prontas para recriar'
        ELSE '⚠️ Algumas tabelas ainda existem'
    END as status_tabelas;

COMMIT;

SELECT '✅ HISTÓRICO LIMPO!' as resultado;
SELECT 'PRÓXIMO PASSO: Recompilar e reiniciar o backend' as proxima_acao;
SELECT 'O Flyway vai reexecutar V226, V227, V228 corretamente' as o_que_vai_acontecer;

