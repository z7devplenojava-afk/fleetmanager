-- =====================================================================
-- V4598: Melhorias de Gestão de Garagens (Check-in, Check-out, QR Code)
-- Permite saída de pátio (to_garage_id nullable), registro de motorista,
-- cliente alocado, horários de entrada e saída e tempo de permanência.
-- =====================================================================

-- 1. Permitir que to_garage_id seja nulo (necessário para Check-out / Saída do pátio para operação)
ALTER TABLE garage_movements ALTER COLUMN to_garage_id DROP NOT NULL;

-- 2. Adicionar campos complementares de rastreabilidade
ALTER TABLE garage_movements ADD COLUMN IF NOT EXISTS movement_type VARCHAR(20) DEFAULT 'TRANSFER';
ALTER TABLE garage_movements ADD COLUMN IF NOT EXISTS driver_name VARCHAR(150);
ALTER TABLE garage_movements ADD COLUMN IF NOT EXISTS client_name VARCHAR(150);
ALTER TABLE garage_movements ADD COLUMN IF NOT EXISTS entry_time TIMESTAMP;
ALTER TABLE garage_movements ADD COLUMN IF NOT EXISTS exit_time TIMESTAMP;
ALTER TABLE garage_movements ADD COLUMN IF NOT EXISTS stay_duration_minutes BIGINT;
ALTER TABLE garage_movements ADD COLUMN IF NOT EXISTS active_stay BOOLEAN DEFAULT FALSE;

-- 3. Índices para performance de consulta
CREATE INDEX IF NOT EXISTS idx_gm_active_stay ON garage_movements (company_id, active_stay);
CREATE INDEX IF NOT EXISTS idx_gm_vehicle_active ON garage_movements (vehicle_id, active_stay);
