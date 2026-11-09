-- Adiciona coluna icon_url separada de logo_url na tabela companies
-- Permite manter a logomarca completa (logo_url) e o ícone compacto (icon_url, exibido na sidebar recolhida e selos quadrados)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS icon_url VARCHAR(500);

