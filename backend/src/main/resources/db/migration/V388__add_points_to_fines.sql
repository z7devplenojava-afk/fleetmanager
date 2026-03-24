-- Adicionar coluna points (pontos na CNH) na tabela fines
DO $$
BEGIN
    -- Verificar se a coluna points já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'fines' 
        AND column_name = 'points'
    ) THEN
        -- Adicionar a coluna points
        ALTER TABLE fines ADD COLUMN points INTEGER DEFAULT 0;
        
        -- Adicionar comentário
        COMMENT ON COLUMN fines.points IS 'Pontos na CNH do motorista devido à infração';
        
        RAISE NOTICE 'Coluna points adicionada à tabela fines';
    ELSE
        RAISE NOTICE 'Coluna points já existe na tabela fines';
    END IF;
END $$;
