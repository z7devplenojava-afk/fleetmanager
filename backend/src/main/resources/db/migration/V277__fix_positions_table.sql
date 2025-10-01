-- Migration: V277__fix_positions_table.sql
-- Corrigir estrutura da tabela positions se necessário

-- Verificar se a coluna unit_id existe, se não, adicionar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'positions' AND column_name = 'unit_id'
    ) THEN
        -- Adicionar coluna unit_id se não existir
        ALTER TABLE positions ADD COLUMN unit_id UUID;
        
        -- Adicionar foreign key se não existir
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'positions' AND constraint_name = 'positions_unit_id_fkey'
        ) THEN
            ALTER TABLE positions ADD CONSTRAINT positions_unit_id_fkey 
            FOREIGN KEY (unit_id) REFERENCES units(id);
        END IF;
        
        -- Atualizar posições existentes para usar a unidade padrão
        UPDATE positions SET unit_id = (SELECT id FROM units WHERE name = 'Matriz' LIMIT 1)
        WHERE unit_id IS NULL;
        
        -- Tornar a coluna NOT NULL após atualizar
        ALTER TABLE positions ALTER COLUMN unit_id SET NOT NULL;
    END IF;
END $$; 