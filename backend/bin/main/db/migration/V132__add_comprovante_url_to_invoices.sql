-- Migration para adicionar campo comprovante_url na tabela invoices
-- V249__add_comprovante_url_to_invoices.sql

-- Adicionar campo para URL do comprovante de pagamento
ALTER TABLE invoices 
ADD COLUMN comprovante_url VARCHAR(500);

-- Adicionar índice para melhor performance
CREATE INDEX idx_invoices_comprovante_url ON invoices(comprovante_url);

-- Atualizar comentário da tabela
COMMENT ON COLUMN invoices.comprovante_url IS 'URL/caminho do arquivo de comprovante de pagamento';