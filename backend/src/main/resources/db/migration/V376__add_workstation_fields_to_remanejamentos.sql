-- Adiciona campos de postos de trabalho na tabela remanejamentos

DO $$ 
BEGIN
    -- Adicionar coluna origin_workstation_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'remanejamentos' 
        AND column_name = 'origin_workstation_id'
    ) THEN
        ALTER TABLE remanejamentos ADD COLUMN origin_workstation_id UUID;
    END IF;
    
    -- Adicionar coluna destination_workstation_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'remanejamentos' 
        AND column_name = 'destination_workstation_id'
    ) THEN
        ALTER TABLE remanejamentos ADD COLUMN destination_workstation_id UUID;
    END IF;
    
    -- Adicionar foreign keys se a tabela work_posts existir e tiver PRIMARY KEY
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'work_posts' 
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
        -- Remover constraint se existir antes de recriar
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'remanejamentos'
            AND constraint_name = 'fk_remanejamento_origin_workstation'
        ) THEN
            ALTER TABLE remanejamentos DROP CONSTRAINT fk_remanejamento_origin_workstation;
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'remanejamentos'
            AND constraint_name = 'fk_remanejamento_destination_workstation'
        ) THEN
            ALTER TABLE remanejamentos DROP CONSTRAINT fk_remanejamento_destination_workstation;
        END IF;
        
        -- Adicionar foreign keys apenas se não existirem
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'remanejamentos'
            AND constraint_name = 'fk_remanejamento_origin_workstation'
        ) THEN
            ALTER TABLE remanejamentos 
                ADD CONSTRAINT fk_remanejamento_origin_workstation 
                FOREIGN KEY (origin_workstation_id) REFERENCES work_posts(id);
        END IF;
            
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'remanejamentos'
            AND constraint_name = 'fk_remanejamento_destination_workstation'
        ) THEN
            ALTER TABLE remanejamentos 
                ADD CONSTRAINT fk_remanejamento_destination_workstation 
                FOREIGN KEY (destination_workstation_id) REFERENCES work_posts(id);
        END IF;
    END IF;
END $$;
