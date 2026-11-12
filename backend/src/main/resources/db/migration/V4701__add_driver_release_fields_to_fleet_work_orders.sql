-- ===========================================================================
-- V4701: Campos de solicitação (Motorista / Data da Solicitação)
--        e Conferência / Liberação do Veículo na Ordem de Serviço (OS)
-- ===========================================================================

ALTER TABLE fleet_work_orders
    ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS request_date DATE,
    ADD COLUMN IF NOT EXISTS services_verified BOOLEAN,
    ADD COLUMN IF NOT EXISTS release_date DATE,
    ADD COLUMN IF NOT EXISTS release_time VARCHAR(10),
    ADD COLUMN IF NOT EXISTS released_by_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS release_signature TEXT,
    ADD COLUMN IF NOT EXISTS release_signature_date TIMESTAMP;

