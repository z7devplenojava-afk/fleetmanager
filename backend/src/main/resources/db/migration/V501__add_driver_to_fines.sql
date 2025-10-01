-- Adicionar coluna driver_id na tabela fines
ALTER TABLE fines ADD COLUMN driver_id UUID;

-- Adicionar chave estrangeira para drivers
ALTER TABLE fines ADD CONSTRAINT fk_fines_driver 
    FOREIGN KEY (driver_id) REFERENCES drivers(id);

-- Adicionar índice para melhor performance
CREATE INDEX idx_fines_driver_id ON fines(driver_id);
