-- Migration: V1020__add_cost_center_to_fuel_records.sql
-- Description: Adiciona coluna cost_center à tabela fuel_records (se não existir)

-- Adicionar coluna cost_center (se não existir)
ALTER TABLE fuel_records 
ADD COLUMN IF NOT EXISTS cost_center VARCHAR(100);

-- Adicionar índice para melhor performance (se não existir)
CREATE INDEX IF NOT EXISTS idx_fuel_records_cost_center ON fuel_records(cost_center);

-- Comentário da coluna
COMMENT ON COLUMN fuel_records.cost_center IS 'Centro de custo para segmentação dos abastecimentos por setor';
