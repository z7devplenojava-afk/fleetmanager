-- ===========================================================================
-- V4654: Converte colunas status e type de work_posts para VARCHAR
-- Problema: V379 recriou work_posts usando tipos nativos enum do PostgreSQL
--           (work_post_status e work_post_type). Quando o JPA/Hibernate envia
--           como VARCHAR, o PostgreSQL gerava erro:
--           "coluna 'status' é do tipo work_post_status mas expressão é do tipo character varying"
-- Solucao: Converter para VARCHAR(50) mantendo compatibilidade com @Enumerated(EnumType.STRING).
-- ===========================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'work_posts' AND column_name = 'status'
          AND data_type = 'USER-DEFINED'
    ) THEN
        ALTER TABLE work_posts ALTER COLUMN status DROP DEFAULT;
        ALTER TABLE work_posts ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
        ALTER TABLE work_posts ALTER COLUMN status SET DEFAULT 'EM_IMPLANTACAO';
    END IF;

    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'work_posts' AND column_name = 'type'
          AND data_type = 'USER-DEFINED'
    ) THEN
        ALTER TABLE work_posts ALTER COLUMN type TYPE VARCHAR(50) USING type::text;
    END IF;
END$$;
