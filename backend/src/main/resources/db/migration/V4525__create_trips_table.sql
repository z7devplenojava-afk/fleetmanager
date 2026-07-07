-- V4525: Criar tabela trips (Viagens Operacionais)
-- Esta tabela é referenciada por boardings em V454

CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNED', -- PLANNED, STARTING, IN_PROGRESS, PAUSED, FINISHED, CANCELLED
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_trips_schedule FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_trips_schedule_id ON trips(schedule_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
