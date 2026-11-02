-- Migration: Adicionar colunas do modulo Time Control em time_records
ALTER TABLE time_records ADD COLUMN IF NOT EXISTS origin VARCHAR(50);
ALTER TABLE time_records ADD COLUMN IF NOT EXISTS original_record_id UUID;
ALTER TABLE time_records ADD COLUMN IF NOT EXISTS justification_id UUID;
