-- =====================================================
-- LIMPAR E PERMITIR FLYWAY REEXECUTAR
-- Execute NO DBEAVER AGORA para resolver definitivamente
-- =====================================================

BEGIN;

-- 1. Remover V226, V227, V228 do histórico do Flyway
DELETE FROM flyway_schema_history WHERE version IN ('226', '227', '228');

-- 2. Apagar índices que causam conflito
DROP INDEX IF EXISTS idx_mileage_records_vehicle_id CASCADE;
DROP INDEX IF EXISTS idx_mileage_records_date CASCADE;
DROP INDEX IF EXISTS idx_mileage_records_vehicle_date CASCADE;
DROP INDEX IF EXISTS idx_mileage_records_driver CASCADE;
DROP INDEX IF EXISTS idx_mileage_records_trip_type CASCADE;
DROP INDEX IF EXISTS idx_mileage_records_fuel_type CASCADE;
DROP INDEX IF EXISTS idx_mileage_records_destination CASCADE;
DROP INDEX IF EXISTS idx_mileage_records_purpose CASCADE;
DROP INDEX IF EXISTS idx_mileage_records_average_consumption CASCADE;
DROP INDEX IF EXISTS idx_mileage_records_cost_per_km CASCADE;
DROP INDEX IF EXISTS idx_mileage_records_vehicle_date_unique CASCADE;

-- 3. Apagar tabelas em ordem correta (respeitando foreign keys)
DROP TABLE IF EXISTS vehicle_maintenances CASCADE;
DROP TABLE IF EXISTS mileage_records CASCADE;
DROP TABLE IF EXISTS fines CASCADE;
DROP TABLE IF EXISTS fuel_records CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;

COMMIT;

-- ===== VERIFICAÇÃO =====
SELECT '✅ HISTÓRICO E TABELAS LIMPOS!' as resultado;

SELECT 
    'Versões removidas do Flyway' as tipo,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM flyway_schema_history WHERE version IN ('226', '227', '228'))
        THEN '✅ V226, V227, V228 removidas'
        ELSE '❌ Ainda existem no histórico'
    END as status;

SELECT 
    'Tabelas removidas' as tipo,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name IN ('vehicle_maintenances', 'mileage_records'))
        THEN '✅ Tabelas apagadas'
        ELSE '❌ Ainda existem'
    END as status;

SELECT '🔄 PRÓXIMO PASSO: Recompilar e reiniciar o backend' as acao;
SELECT 'O Flyway vai reexecutar V226, V227, V228 do zero sem erros' as o_que_vai_acontecer;

