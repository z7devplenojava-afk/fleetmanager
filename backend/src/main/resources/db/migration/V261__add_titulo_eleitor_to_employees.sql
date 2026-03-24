-- Migration para adicionar coluna titulo_eleitor na tabela employees
-- Data: 2025-10-17
-- Descrição: Adiciona o campo titulo_eleitor que estava comentado no modelo Employee

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS titulo_eleitor VARCHAR(20);

-- Adicionar comentário na coluna
COMMENT ON COLUMN employees.titulo_eleitor IS 'Número do título de eleitor do funcionário';

