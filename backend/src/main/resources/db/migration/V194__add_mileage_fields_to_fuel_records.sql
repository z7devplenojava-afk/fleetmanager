-- Migration: V412__add_mileage_fields_to_fuel_records.sql
-- Description: Adiciona campos initial_mileage e final_mileage na tabela fuel_records

-- Adicionar coluna initial_mileage
ALTER TABLE fuel_records
ADD COLUMN initial_mileage INTEGER;

-- Adicionar coluna final_mileage
ALTER TABLE fuel_records
ADD COLUMN final_mileage INTEGER;

-- Adicionar comentários nas colunas
COMMENT ON COLUMN fuel_records.initial_mileage IS 'Quilometragem inicial antes do abastecimento';
COMMENT ON COLUMN fuel_records.final_mileage IS 'Quilometragem final após o abastecimento';

-- Criar índices para melhorar performance de consultas
CREATE INDEX idx_fuel_records_initial_mileage ON fuel_records(initial_mileage);
CREATE INDEX idx_fuel_records_final_mileage ON fuel_records(final_mileage);

-- Atualizar registros existentes (opcional - pode ser feito depois)
-- UPDATE fuel_records SET initial_mileage = mileage - 100, final_mileage = mileage WHERE initial_mileage IS NULL;
