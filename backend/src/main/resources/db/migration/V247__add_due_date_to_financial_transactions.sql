-- Migration para adicionar o campo due_date na tabela financial_transactions
ALTER TABLE financial_transactions 
ADD COLUMN due_date DATE;

-- Opcional: Atualizar registros existentes, se necessário
-- UPDATE financial_transactions SET due_date = date WHERE due_date IS NULL;

-- Opcional: Tornar obrigatório se todos os registros estiverem preenchidos
-- ALTER TABLE financial_transactions ALTER COLUMN due_date SET NOT NULL; 