-- Migration: V410__add_responsible_employee_to_vehicles.sql
-- Description: Adiciona campo responsible_employee_id na tabela vehicles

-- Adicionar coluna responsible_employee_id
ALTER TABLE vehicles 
ADD COLUMN responsible_employee_id UUID;

-- Adicionar comentário na coluna
COMMENT ON COLUMN vehicles.responsible_employee_id IS 'ID do funcionário responsável pelo veículo';

-- Adicionar índice para melhorar performance de consultas
CREATE INDEX idx_vehicles_responsible_employee_id ON vehicles(responsible_employee_id);

-- Adicionar foreign key constraint (opcional - pode ser adicionada depois se necessário)
-- ALTER TABLE vehicles 
-- ADD CONSTRAINT fk_vehicles_responsible_employee 
-- FOREIGN KEY (responsible_employee_id) REFERENCES employees(id);
