-- Criar o enum work_post_status se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_post_status') THEN
        CREATE TYPE work_post_status AS ENUM (
            'EM_IMPLANTACAO', 
            'ATIVO', 
            'INATIVO', 
            'SUSPENSO', 
            'CANCELADO', 
            'EM_ANALISE', 
            'PENDENTE'
        );
    END IF;
END $$;

-- Verificar se a tabela work_posts existe e tem a coluna status
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_posts') THEN
        -- Se a coluna status existe mas não é do tipo enum, alterar
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'work_posts' 
                  AND column_name = 'status' 
                  AND data_type != 'USER-DEFINED') THEN
            ALTER TABLE work_posts ALTER COLUMN status TYPE work_post_status USING status::work_post_status;
        END IF;
    END IF;
END $$;
