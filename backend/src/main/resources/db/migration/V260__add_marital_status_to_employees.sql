-- Migration: V260__add_marital_status_to_employees.sql
-- Descrição: Adicionar coluna marital_status à tabela employees

ALTER TABLE employees ADD COLUMN IF NOT EXISTS marital_status VARCHAR(20);

COMMENT ON COLUMN employees.marital_status IS 'Estado civil do funcionário (SOLTEIRO, CASADO, DIVORCIADO, VIUVO, etc)';

