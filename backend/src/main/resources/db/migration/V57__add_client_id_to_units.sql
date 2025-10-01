-- Adicionar coluna client_id na tabela units
ALTER TABLE units ADD COLUMN client_id BIGINT;

-- Adicionar índice para melhorar performance
CREATE INDEX idx_units_client_id ON units(client_id);

-- Adicionar foreign key
ALTER TABLE units ADD CONSTRAINT fk_units_client_id 
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- Comentário na coluna
COMMENT ON COLUMN units.client_id IS 'Referência ao cliente proprietário da unidade'; 