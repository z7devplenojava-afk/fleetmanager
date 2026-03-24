-- Migration: V272__migrate_work_post_trainings_to_uuid.sql
-- Mapeia work_post_id BIGINT para UUID em work_post_trainings

-- 1. Como work_posts já está usando UUID, vamos apenas alterar o tipo da coluna
-- e gerar novos UUIDs para os valores existentes (que serão referenciados por work_posts)
-- Primeiro, vamos remover a foreign key se existir
ALTER TABLE work_post_trainings DROP CONSTRAINT IF EXISTS fk_work_post_trainings_work_post;

-- 2. Alterar o tipo da coluna para UUID gerando novos UUIDs
ALTER TABLE work_post_trainings ALTER COLUMN work_post_id TYPE UUID USING 
    CASE 
        WHEN work_post_id IS NOT NULL THEN gen_random_uuid()
        ELSE NULL
    END;

-- 4. Recria a foreign key
ALTER TABLE work_post_trainings
  ADD CONSTRAINT fk_work_post_trainings_work_post
  FOREIGN KEY (work_post_id) REFERENCES work_posts(id); 