-- Corrige o tipo do ID da tabela shift_change_forms de UUID para BIGSERIAL

-- Remove a constraint de chave primária
ALTER TABLE shift_change_forms DROP CONSTRAINT IF EXISTS shift_change_forms_pkey;

-- Remove a coluna id atual (UUID)
ALTER TABLE shift_change_forms DROP COLUMN IF EXISTS id;

-- Adiciona nova coluna id como BIGSERIAL
ALTER TABLE shift_change_forms ADD COLUMN id BIGSERIAL PRIMARY KEY;

