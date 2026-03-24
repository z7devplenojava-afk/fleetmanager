-- V248__add_justification_to_overtime.sql
-- Adiciona coluna justification à tabela overtime (executa após V230__create_overtime_table.sql)

ALTER TABLE overtime
ADD COLUMN IF NOT EXISTS justification TEXT;
