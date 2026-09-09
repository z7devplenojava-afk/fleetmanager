-- V4564__add_work_post_to_fleet_work_orders.sql
-- Vincula a Ordem de Serviço de frota à Obra (Posto) onde o veículo está alocado,
-- permitindo saber em qual Obra (Cliente) o veículo estava no momento da OS.

-- 1. Coluna de alocação em fleet_work_orders
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS work_post_id UUID;

-- 2. Índice para consultas por Obra
CREATE INDEX IF NOT EXISTS idx_fleet_work_orders_work_post_id ON fleet_work_orders (work_post_id);

-- 3. Integridade referencial com work_posts (se a tabela existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_posts') THEN
        -- Remove a constraint anterior se existir (re-execução idempotente)
        ALTER TABLE fleet_work_orders DROP CONSTRAINT IF EXISTS fk_fleet_work_orders_work_post;
        ALTER TABLE fleet_work_orders
            ADD CONSTRAINT fk_fleet_work_orders_work_post
            FOREIGN KEY (work_post_id) REFERENCES work_posts (id);
    END IF;
END $$;

-- 4. Backfill: OSs sem Obra recebem a alocação atual do veículo
UPDATE fleet_work_orders o
SET work_post_id = v.work_post_id
FROM vehicles v
WHERE o.vehicle_id = v.id
  AND o.work_post_id IS NULL
  AND v.work_post_id IS NOT NULL;

-- 5. Backfill: client_id derivado da Obra quando ausente
UPDATE fleet_work_orders o
SET client_id = c.id
FROM work_posts wp
JOIN clients c ON c.id = wp.client_id
WHERE o.work_post_id = wp.id
  AND o.client_id IS NULL;
