-- Migration para adicionar campo centro de custo na tabela invoices
-- V284__add_cost_center_to_invoices.sql

-- Adicionar campo centro de custo
ALTER TABLE invoices 
ADD COLUMN cost_center VARCHAR(100);

-- Adicionar índice para melhor performance
CREATE INDEX idx_invoices_cost_center ON invoices(cost_center);

-- Atualizar comentário da tabela
COMMENT ON COLUMN invoices.cost_center IS 'Centro de custo para segmentação das despesas por setor';