-- Script para adicionar a coluna cost_center na tabela fuel_records
-- Execute este script no banco de dados se a coluna não existir

ALTER TABLE fuel_records 
ADD COLUMN IF NOT EXISTS cost_center VARCHAR(255);

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'fuel_records' 
AND column_name = 'cost_center';
