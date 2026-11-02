-- V4657: Adiciona a coluna installments à tabela purchase_requests caso não exista
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS installments INTEGER;
