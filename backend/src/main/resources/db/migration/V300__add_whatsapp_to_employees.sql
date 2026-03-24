-- Adicionar coluna whatsapp na tabela employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20);

-- Comentário na coluna
COMMENT ON COLUMN employees.whatsapp IS 'Número de WhatsApp do funcionário (formato internacional: 55XXXXXXXXXXX)';

