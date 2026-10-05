-- V4619__add_ficha_empregado_missing_fields.sql
-- Adiciona campos da Ficha de Registro de Empregado que faltavam na tabela employees

ALTER TABLE employees ADD COLUMN IF NOT EXISTS conta_corrente_digito VARCHAR(10);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS numero_portaria VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS data_portaria DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS fgts_conta VARCHAR(50);
