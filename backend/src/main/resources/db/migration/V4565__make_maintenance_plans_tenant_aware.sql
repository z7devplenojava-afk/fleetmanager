-- V4565__make_maintenance_plans_tenant_aware.sql
-- Torna a tabela maintenance_plans multi-tenant: adiciona company_id,
-- índice e backfill a partir da empresa do veículo vinculado.

-- 1. Coluna de tenant
ALTER TABLE maintenance_plans ADD COLUMN IF NOT EXISTS company_id UUID;

-- 2. Índice para o filtro de tenant
CREATE INDEX IF NOT EXISTS idx_maintenance_plans_company_id ON maintenance_plans (company_id);

-- 3. Backfill: herda a empresa do veículo do plano
UPDATE maintenance_plans mp
SET company_id = v.company_id
FROM vehicles v
WHERE mp.vehicle_id = v.id
  AND mp.company_id IS NULL
  AND v.company_id IS NOT NULL;
