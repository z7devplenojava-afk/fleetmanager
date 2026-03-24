-- V436: Criar tabela travel_trips (Gestão de Viagens)
-- Suporta viagens do tipo FRETADO ou TURISTICO com até 4 pegadas

CREATE TABLE IF NOT EXISTS travel_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(20) UNIQUE,
    trip_type VARCHAR(20) NOT NULL DEFAULT 'FRETADO',

    -- Pegadas (trechos da viagem, até 4)
    legs INTEGER NOT NULL DEFAULT 1,
    leg1_description VARCHAR(300),
    leg2_description VARCHAR(300),
    leg3_description VARCHAR(300),
    leg4_description VARCHAR(300),

    -- Tempo e distância
    estimated_duration BIGINT, -- duração em segundos (java.time.Duration)
    duration_multiplier DOUBLE PRECISION DEFAULT 1.0,
    distance_km DOUBLE PRECISION,

    -- Relacionamentos
    route_id UUID,
    client_id UUID,

    -- Endereços
    origin_address VARCHAR(500),
    destination_address VARCHAR(500),

    -- Controle
    observations VARCHAR(1000),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_travel_trips_route FOREIGN KEY (route_id) REFERENCES routes(id),
    CONSTRAINT fk_travel_trips_client FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_travel_trips_type ON travel_trips(trip_type);
CREATE INDEX IF NOT EXISTS idx_travel_trips_status ON travel_trips(status);
CREATE INDEX IF NOT EXISTS idx_travel_trips_client ON travel_trips(client_id);

-- Adicionar campo travel_trip_id na tabela schedules para vincular escala à viagem
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS travel_trip_id UUID;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS legs INTEGER DEFAULT 1;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_schedules_travel_trip') THEN
        ALTER TABLE schedules ADD CONSTRAINT fk_schedules_travel_trip FOREIGN KEY (travel_trip_id) REFERENCES travel_trips(id);
    END IF;
END $$;

-- Tornar location_id nullable (antes era NOT NULL) para permitir escalas com viagem ao invés de posto
ALTER TABLE schedules ALTER COLUMN location_id DROP NOT NULL;
