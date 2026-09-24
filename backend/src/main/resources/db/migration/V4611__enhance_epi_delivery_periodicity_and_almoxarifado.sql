-- ===================================================================
-- Migration: V4611__enhance_epi_delivery_periodicity_and_almoxarifado.sql
-- Descrição: Suporte à periodicidade de troca de EPIs, controle de roles
--            (RH, DP, SST, Almoxarifado), conferência de estoque pelo
--            almoxarifado e estorno de estoque em trocas/devoluções.
-- ===================================================================

-- 1. Colunas de periodicidade na tabela de EPIs
ALTER TABLE personal_protective_equipment
ADD COLUMN IF NOT EXISTS validity_months INTEGER DEFAULT 6,
ADD COLUMN IF NOT EXISTS periodicity_days INTEGER DEFAULT 180;

-- Atualizar periodicidades padrão com base na categoria ou nome do equipamento
UPDATE personal_protective_equipment
SET validity_months = 36, periodicity_days = 1095
WHERE name ILIKE '%capacete%' AND (validity_months IS NULL OR validity_months = 6);

UPDATE personal_protective_equipment
SET validity_months = 1, periodicity_days = 30
WHERE (name ILIKE '%plug%' OR name ILIKE '%luva%') AND (validity_months IS NULL OR validity_months = 6);

UPDATE personal_protective_equipment
SET validity_months = 12, periodicity_days = 365
WHERE (name ILIKE '%auricular concha%' OR name ILIKE '%abafador%' OR name ILIKE '%cinto%' OR name ILIKE '%colete%') AND (validity_months IS NULL OR validity_months = 6);

UPDATE personal_protective_equipment
SET validity_months = 6, periodicity_days = 180
WHERE (name ILIKE '%óculos%' OR name ILIKE '%oculos%' OR name ILIKE '%calçado%' OR name ILIKE '%calcado%' OR name ILIKE '%bota%' OR name ILIKE '%botina%' OR name ILIKE '%uniforme%') AND (validity_months IS NULL);

-- 2. Colunas de controle de conferência de almoxarifado, estorno e periodicidade em epi_deliveries
ALTER TABLE epi_deliveries
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'CONCLUIDO',
ADD COLUMN IF NOT EXISTS verified_by_almoxarifado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_by_almoxarifado_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS verified_by_almoxarifado_user_id UUID,
ADD COLUMN IF NOT EXISTS returned_epi_id UUID,
ADD COLUMN IF NOT EXISTS returned_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS returned_stock_refunded BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS returned_condition VARCHAR(50),
ADD COLUMN IF NOT EXISTS next_exchange_date DATE,
ADD COLUMN IF NOT EXISTS exchange_justification TEXT;

-- 3. Colunas de controle de almoxarifado em epi_delivery_forms
ALTER TABLE epi_delivery_forms
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'CONCLUIDO',
ADD COLUMN IF NOT EXISTS verified_by_almoxarifado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_by_almoxarifado_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS verified_by_almoxarifado_user_id UUID;
