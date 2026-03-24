-- Migration para melhorar visitas e unidades para otimização de rota

-- Adicionar campos à tabela visits para otimização de rota (apenas se a tabela existir)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='visits') THEN
        -- visit_schedule_id
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visits' AND column_name='visit_schedule_id') THEN
            ALTER TABLE visits ADD COLUMN visit_schedule_id UUID;
        END IF;
        
        -- estimated_duration_minutes
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visits' AND column_name='estimated_duration_minutes') THEN
            ALTER TABLE visits ADD COLUMN estimated_duration_minutes INTEGER DEFAULT 30;
        END IF;
        
        -- priority_level
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visits' AND column_name='priority_level') THEN
            ALTER TABLE visits ADD COLUMN priority_level INTEGER DEFAULT 1;
        END IF;
        
        -- preferred_time_start
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visits' AND column_name='preferred_time_start') THEN
            ALTER TABLE visits ADD COLUMN preferred_time_start TIMESTAMP;
        END IF;
        
        -- preferred_time_end
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visits' AND column_name='preferred_time_end') THEN
            ALTER TABLE visits ADD COLUMN preferred_time_end TIMESTAMP;
        END IF;
        
        -- route_order
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visits' AND column_name='route_order') THEN
            ALTER TABLE visits ADD COLUMN route_order INTEGER;
        END IF;
        
        -- travel_time_to_next_minutes
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visits' AND column_name='travel_time_to_next_minutes') THEN
            ALTER TABLE visits ADD COLUMN travel_time_to_next_minutes INTEGER;
        END IF;
        
        -- travel_distance_to_next_km
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visits' AND column_name='travel_distance_to_next_km') THEN
            ALTER TABLE visits ADD COLUMN travel_distance_to_next_km DOUBLE PRECISION;
        END IF;
        
        -- Adicionar constraint para visit_schedule_id se não existir
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='fk_visits_visit_schedule') THEN
            ALTER TABLE visits ADD CONSTRAINT fk_visits_visit_schedule 
                FOREIGN KEY (visit_schedule_id) REFERENCES visit_schedules(id);
        END IF;
    END IF;
END $$;

-- Adicionar campos à tabela units para coordenadas geográficas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='units' AND column_name='latitude') THEN
        ALTER TABLE units ADD COLUMN latitude DOUBLE PRECISION;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='units' AND column_name='longitude') THEN
        ALTER TABLE units ADD COLUMN longitude DOUBLE PRECISION;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='units' AND column_name='address_city') THEN
        ALTER TABLE units ADD COLUMN address_city VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='units' AND column_name='address_state') THEN
        ALTER TABLE units ADD COLUMN address_state VARCHAR(2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='units' AND column_name='address_zip_code') THEN
        ALTER TABLE units ADD COLUMN address_zip_code VARCHAR(10);
    END IF;
END $$;

-- Índices para performance
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='visits') THEN
        CREATE INDEX IF NOT EXISTS idx_visits_schedule ON visits(visit_schedule_id);
        CREATE INDEX IF NOT EXISTS idx_visits_route_order ON visits(route_order);
        CREATE INDEX IF NOT EXISTS idx_visits_priority ON visits(priority_level);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_units_coordinates ON units(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_units_address_city ON units(address_city);

-- Comentários para documentação
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='visits') THEN
        COMMENT ON COLUMN visits.estimated_duration_minutes IS 'Duração estimada da visita em minutos';
        COMMENT ON COLUMN visits.priority_level IS 'Nível de prioridade da visita (1-5)';
        COMMENT ON COLUMN visits.route_order IS 'Ordem da visita na rota otimizada';
        COMMENT ON COLUMN visits.travel_time_to_next_minutes IS 'Tempo de viagem para próxima visita em minutos';
        COMMENT ON COLUMN visits.travel_distance_to_next_km IS 'Distância para próxima visita em quilômetros';
    END IF;
END $$;

COMMENT ON COLUMN units.latitude IS 'Latitude para localização geográfica';
COMMENT ON COLUMN units.longitude IS 'Longitude para localização geográfica';
