-- Migration: V269__fix_work_post_epis_uuid.sql
-- Corrigir a coluna work_post_id da tabela work_post_epis para UUID

-- 1. Remover constraints de foreign key se existirem
ALTER TABLE work_post_epis DROP CONSTRAINT IF EXISTS fk_work_post_epis_work_post;

-- 2. Alterar a coluna work_post_id para UUID
ALTER TABLE work_post_epis ALTER COLUMN work_post_id TYPE UUID USING 
    CASE 
        WHEN work_post_id IS NOT NULL THEN gen_random_uuid()
        ELSE NULL
    END;

-- 3. Recriar a foreign key constraint
ALTER TABLE work_post_epis ADD CONSTRAINT fk_work_post_epis_work_post 
    FOREIGN KEY (work_post_id) REFERENCES work_posts(id); 