-- Adicionar coluna title (título da visita) na tabela visit_controls
DO $$
BEGIN
    -- Verificar se a coluna title já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'visit_controls' 
        AND column_name = 'title'
    ) THEN
        -- Adicionar a coluna title
        ALTER TABLE visit_controls ADD COLUMN title VARCHAR(255);
        
        -- Adicionar comentário
        COMMENT ON COLUMN visit_controls.title IS 'Título da visita para identificação';
        
        RAISE NOTICE 'Coluna title adicionada à tabela visit_controls';
    ELSE
        RAISE NOTICE 'Coluna title já existe na tabela visit_controls';
    END IF;
END $$;
