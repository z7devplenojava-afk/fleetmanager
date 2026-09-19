-- Adiciona a coluna banner_urls na tabela companies para armazenar os banners motivacionais do dashboard
ALTER TABLE companies ADD COLUMN IF NOT EXISTS banner_urls TEXT;

COMMENT ON COLUMN companies.banner_urls IS 'Lista de URLs de imagens dos banners rotativos motivacionais do dashboard da empresa';
