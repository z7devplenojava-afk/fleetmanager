-- Migration V372: Add approved_by column to shift_change_forms table
-- Adiciona campo para armazenar o nome do aprovador da solicitação de troca de plantão

ALTER TABLE shift_change_forms 
ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255);












