-- =====================================================
-- CORRIGIR TABELA activity_reports (secured_guard_test)
-- =====================================================
-- Execute este script no DBeaver/pgAdmin no banco secured_guard_test

-- 1. Limpar registro da migração V307 (se existir)
DELETE FROM flyway_schema_history WHERE version = '307';

-- 2. Adicionar TODOS os campos @Embeddable que estão faltando

-- BallisticPlate @Embeddable
ALTER TABLE activity_reports
ADD COLUMN IF NOT EXISTS ballistic_plate_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS ballistic_plate_valid_until DATE;

-- WeaponRegistry @Embeddable  
ALTER TABLE activity_reports
ADD COLUMN IF NOT EXISTS weapon_registry_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS weapon_registry_valid_until DATE;

-- MedicalConsultation @Embeddable
ALTER TABLE activity_reports
ADD COLUMN IF NOT EXISTS consultation_date DATE,
ADD COLUMN IF NOT EXISTS reason VARCHAR(255),
ADD COLUMN IF NOT EXISTS doctor VARCHAR(255),
ADD COLUMN IF NOT EXISTS result TEXT;

-- 3. Verificar se as colunas foram criadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'activity_reports' 
  AND column_name IN (
    'ballistic_plate_number', 
    'ballistic_plate_valid_until',
    'weapon_registry_number',
    'weapon_registry_valid_until',
    'consultation_date',
    'reason',
    'doctor',
    'result'
  )
ORDER BY column_name;

-- 4. Verificar histórico do Flyway
SELECT version, description, installed_on, success 
FROM flyway_schema_history 
ORDER BY installed_rank DESC 
LIMIT 10;

-- =====================================================
-- DEPOIS DE EXECUTAR ESTE SCRIPT:
-- =====================================================
-- 1. Reinicie o backend no IntelliJ/VS Code
-- 2. O Flyway vai executar a migration V307
-- 3. O backend deve subir com sucesso! ✅
-- =====================================================

