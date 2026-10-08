-- Migration: V4639__add_nfe_key_to_invoices.sql
-- Description: Adiciona coluna nfe_key na tabela invoices

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS nfe_key VARCHAR(100);
