-- V249__add_product_variations.sql
-- Adiciona campos para variações de produtos (executa após V166__create_products_table.sql)

-- Adicionar campos para variações de produtos
ALTER TABLE products ADD COLUMN IF NOT EXISTS size VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS color VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS footwear_size VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS clothing_size VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS belt_size VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS material VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS style VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS season VARCHAR(50);

-- Adicionar comentários para documentar os campos
COMMENT ON COLUMN products.size IS 'Tamanho (P, M, G, GG, 36, 37, 38, etc.)';
COMMENT ON COLUMN products.color IS 'Cor (Cinza, Preto, Branco, Azul, etc.)';
COMMENT ON COLUMN products.product_type IS 'Tipo (Padrão, Social, Convencional, Nilon, Táticos, etc.)';
COMMENT ON COLUMN products.footwear_size IS 'Numeração para calçados (36, 37, 38, etc.)';
COMMENT ON COLUMN products.clothing_size IS 'Tamanho para roupas (P, M, G, GG, etc.)';
COMMENT ON COLUMN products.belt_size IS 'Tamanho para cintos (90, 95, 100, etc.)';
COMMENT ON COLUMN products.material IS 'Material (Algodão, Poliéster, Couro, etc.)';
COMMENT ON COLUMN products.style IS 'Estilo (Casual, Formal, Esportivo, etc.)';
COMMENT ON COLUMN products.gender IS 'Gênero (Masculino, Feminino, Unissex)';
COMMENT ON COLUMN products.season IS 'Estação (Verão, Inverno, Primavera, Outono, Todas)';
