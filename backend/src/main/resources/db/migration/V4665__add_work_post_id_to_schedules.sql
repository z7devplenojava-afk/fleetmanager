-- V4665: Adiciona coluna work_post_id na tabela schedules e garante colunas auxiliares em companies
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS work_post_id UUID REFERENCES work_posts(id) ON DELETE SET NULL;

-- Garante que colunas opcionais de companies existam para evitar falha no mapeamento JPA
ALTER TABLE companies ADD COLUMN IF NOT EXISTS max_users INTEGER;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS banner_urls TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tema_cor VARCHAR(50);
