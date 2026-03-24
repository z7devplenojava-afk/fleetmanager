-- Migration V307: Adicionar campos @Embeddable à tabela activity_reports

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

-- Comentários
COMMENT ON COLUMN activity_reports.ballistic_plate_number IS 'Número da placa balística';
COMMENT ON COLUMN activity_reports.ballistic_plate_valid_until IS 'Data de validade da placa balística';
COMMENT ON COLUMN activity_reports.weapon_registry_number IS 'Número do registro da arma';
COMMENT ON COLUMN activity_reports.weapon_registry_valid_until IS 'Data de validade do registro da arma';
COMMENT ON COLUMN activity_reports.consultation_date IS 'Data da consulta médica';
COMMENT ON COLUMN activity_reports.reason IS 'Motivo da consulta médica';
COMMENT ON COLUMN activity_reports.doctor IS 'Nome do médico responsável';
COMMENT ON COLUMN activity_reports.result IS 'Resultado/diagnóstico da consulta médica';
