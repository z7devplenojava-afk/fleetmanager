-- Migração para tornar o campo unit_id opcional na tabela positions
-- Executar após V277__fix_positions_table.sql
-- Isso resolve o problema de incompatibilidade entre o modelo Java e a estrutura da tabela

-- Tornar o campo unit_id opcional (nullable) novamente
-- V277 torna o campo NOT NULL, mas o modelo Java permite null
ALTER TABLE positions ALTER COLUMN unit_id DROP NOT NULL;

-- Remover a foreign key constraint se existir para permitir posições sem unidade
-- ALTER TABLE positions DROP CONSTRAINT IF EXISTS positions_unit_id_fkey;

-- Adicionar uma foreign key constraint opcional (comentado para evitar problemas)
-- ALTER TABLE positions ADD CONSTRAINT positions_unit_id_fkey 
--     FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;
