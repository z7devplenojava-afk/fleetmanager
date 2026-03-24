-- Adicionar coluna processed_at na tabela payment_receipts
-- Esta coluna armazenará a data real de processamento dos comprovantes

ALTER TABLE payment_receipts 
ADD COLUMN processed_at TIMESTAMP;

-- Atualizar registros existentes para usar updated_at como processed_at
UPDATE payment_receipts 
SET processed_at = updated_at 
WHERE processed_at IS NULL;

-- Comentário da coluna
COMMENT ON COLUMN payment_receipts.processed_at IS 'Data e hora em que o comprovante foi processado/importado';
