-- Migration V244: Alterar coluna mileage para suportar decimais
-- Alterar a coluna mileage da tabela vehicle_maintenances para suportar até 9 casas decimais

-- Primeiro, criar uma coluna temporária
ALTER TABLE vehicle_maintenances ADD COLUMN mileage_new DECIMAL(15,9);

-- Copiar dados existentes (convertendo Integer para BigDecimal)
UPDATE vehicle_maintenances SET mileage_new = mileage WHERE mileage IS NOT NULL;

-- Remover a coluna antiga
ALTER TABLE vehicle_maintenances DROP COLUMN mileage;

-- Renomear a nova coluna
ALTER TABLE vehicle_maintenances RENAME COLUMN mileage_new TO mileage;

-- Adicionar comentário explicativo
COMMENT ON COLUMN vehicle_maintenances.mileage IS 'Quilometragem com até 9 casas decimais (ex: 125.125)';
