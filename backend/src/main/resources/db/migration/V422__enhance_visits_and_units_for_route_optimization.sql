-- Migration para melhorar visitas e unidades para otimização de rota

-- Adicionar campos à tabela visits para otimização de rota
ALTER TABLE visits ADD COLUMN visit_schedule_id UUID;
ALTER TABLE visits ADD COLUMN estimated_duration_minutes INTEGER DEFAULT 30;
ALTER TABLE visits ADD COLUMN priority_level INTEGER DEFAULT 1;
ALTER TABLE visits ADD COLUMN preferred_time_start TIMESTAMP;
ALTER TABLE visits ADD COLUMN preferred_time_end TIMESTAMP;
ALTER TABLE visits ADD COLUMN route_order INTEGER;
ALTER TABLE visits ADD COLUMN travel_time_to_next_minutes INTEGER;
ALTER TABLE visits ADD COLUMN travel_distance_to_next_km DOUBLE PRECISION;

-- Adicionar constraint para visit_schedule_id
ALTER TABLE visits ADD CONSTRAINT fk_visits_visit_schedule 
    FOREIGN KEY (visit_schedule_id) REFERENCES visit_schedules(id);

-- Adicionar campos à tabela units para coordenadas geográficas
ALTER TABLE units ADD COLUMN latitude DOUBLE PRECISION;
ALTER TABLE units ADD COLUMN longitude DOUBLE PRECISION;
ALTER TABLE units ADD COLUMN address_city VARCHAR(100);
ALTER TABLE units ADD COLUMN address_state VARCHAR(2);
ALTER TABLE units ADD COLUMN address_zip_code VARCHAR(10);

-- Índices para performance
CREATE INDEX idx_visits_schedule ON visits(visit_schedule_id);
CREATE INDEX idx_visits_route_order ON visits(route_order);
CREATE INDEX idx_visits_priority ON visits(priority_level);
CREATE INDEX idx_units_coordinates ON units(latitude, longitude);
CREATE INDEX idx_units_address_city ON units(address_city);

-- Comentários para documentação
COMMENT ON COLUMN visits.estimated_duration_minutes IS 'Duração estimada da visita em minutos';
COMMENT ON COLUMN visits.priority_level IS 'Nível de prioridade da visita (1-5)';
COMMENT ON COLUMN visits.route_order IS 'Ordem da visita na rota otimizada';
COMMENT ON COLUMN visits.travel_time_to_next_minutes IS 'Tempo de viagem para próxima visita em minutos';
COMMENT ON COLUMN visits.travel_distance_to_next_km IS 'Distância para próxima visita em quilômetros';
COMMENT ON COLUMN units.latitude IS 'Latitude para localização geográfica';
COMMENT ON COLUMN units.longitude IS 'Longitude para localização geográfica';
