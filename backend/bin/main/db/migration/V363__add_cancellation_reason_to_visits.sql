-- Adicionar coluna cancellation_reason na tabela visits
ALTER TABLE visits 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Comentário na coluna
COMMENT ON COLUMN visits.cancellation_reason IS 'Motivo do cancelamento da visita (obrigatório quando status for CANCELLED)';

