-- Corrigir tipos das colunas status e type da tabela work_posts para VARCHAR
-- Motivo: o JDBC estava enviando valores como character varying e o PostgreSQL
--         exigia cast explícito para o enum nativo (work_post_status/work_post_type),
--         causando erro 42804. Usaremos VARCHAR com @Enumerated(EnumType.STRING).

DO $$
BEGIN
    -- Ajustar coluna status se existir e for um tipo enum
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'work_posts' AND column_name = 'status'
    ) THEN
        BEGIN
            -- Converter enum -> texto (sem perda) e então para VARCHAR(30)
            ALTER TABLE work_posts 
            ALTER COLUMN status TYPE VARCHAR(30) USING status::text;
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'Não foi possível alterar tipo da coluna status. Erro: %', SQLERRM;
        END;
    END IF;

    -- Ajustar coluna type se existir e for um tipo enum
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'work_posts' AND column_name = 'type'
    ) THEN
        BEGIN
            ALTER TABLE work_posts 
            ALTER COLUMN type TYPE VARCHAR(30) USING type::text;
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'Não foi possível alterar tipo da coluna type. Erro: %', SQLERRM;
        END;
    END IF;
END$$;

-- Índices opcionais (idempotentes)
CREATE INDEX IF NOT EXISTS idx_work_posts_status ON work_posts(status);
CREATE INDEX IF NOT EXISTS idx_work_posts_type ON work_posts(type);


