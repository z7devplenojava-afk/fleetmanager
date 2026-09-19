-- Migration V4603: Adicionar garage_id na tabela invoices para associar contas a pagar a uma garagem/base
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS garage_id UUID;
CREATE INDEX IF NOT EXISTS idx_invoices_garage_id ON invoices(garage_id);
