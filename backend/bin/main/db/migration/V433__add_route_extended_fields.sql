-- V433: Adicionar campos estendidos à tabela routes para suporte a CEP, endereço, turno, etc.

-- Novos campos de endereço e operação
ALTER TABLE routes ADD COLUMN IF NOT EXISTS origin_cep VARCHAR(10);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS origin_address VARCHAR(500);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS destination_cep VARCHAR(10);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS destination_address VARCHAR(500);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS shift VARCHAR(50);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS execution_time VARCHAR(10);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS distance_km DOUBLE PRECISION DEFAULT 0;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS client_id UUID;

-- Tornar unit_id e location_id opcionais (nullable)
ALTER TABLE routes ALTER COLUMN unit_id DROP NOT NULL;
ALTER TABLE routes ALTER COLUMN location_id DROP NOT NULL;

-- FK para client (se tabela clients existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_routes_client') THEN
            ALTER TABLE routes ADD CONSTRAINT fk_routes_client FOREIGN KEY (client_id) REFERENCES clients(id);
        END IF;
    END IF;
END $$;
