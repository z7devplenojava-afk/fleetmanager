-- Migração para corrigir o tipo da coluna cost_center_id
-- V1008__fix_cost_center_id_type.sql

-- Verificar se a coluna cost_center_id está como UUID e corrigir para VARCHAR(50)
DO $$
BEGIN
    -- Verificar se a coluna existe e qual é o tipo atual
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'measurement_items' 
        AND column_name = 'cost_center_id'
        AND data_type = 'uuid'
    ) THEN
        -- Primeiro remover a constraint de chave estrangeira se existir
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'measurement_items' 
            AND constraint_name = 'fk_measurement_item_cost_center'
            AND constraint_type = 'FOREIGN KEY'
        ) THEN
            ALTER TABLE measurement_items 
            DROP CONSTRAINT fk_measurement_item_cost_center;
            
            RAISE NOTICE 'Constraint de chave estrangeira removida';
        END IF;
        
        -- Agora alterar o tipo de UUID para VARCHAR(50)
        ALTER TABLE measurement_items 
        ALTER COLUMN cost_center_id TYPE VARCHAR(50);
        
        RAISE NOTICE 'Coluna cost_center_id alterada de UUID para VARCHAR(50)';
        
        -- Recriar a constraint se necessário (opcional, já que não temos tabela de cost_centers)
        -- ALTER TABLE measurement_items 
        -- ADD CONSTRAINT fk_measurement_item_cost_center 
        -- FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id);
        
    ELSE
        RAISE NOTICE 'Coluna cost_center_id já está com o tipo correto ou não existe';
    END IF;
END $$;
