-- Fix para resolver problema de versão do schema
-- Este script corrige o problema onde o schema tem versão 1001 mas as migrations só vão até 422

-- Primeiro, vamos verificar se as tabelas que criamos existem
-- Se não existirem, vamos criá-las com os tipos corretos

-- Criar tabela visit_schedules se não existir
CREATE TABLE IF NOT EXISTS visit_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_date DATE NOT NULL,
    supervisor_id UUID NOT NULL,
    client_id UUID NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    total_estimated_time INTEGER,
    total_travel_distance DOUBLE PRECISION,
    observations TEXT,
    optimized_route TEXT,
    route_optimization_score DOUBLE PRECISION,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    
    CONSTRAINT fk_visit_schedules_supervisor FOREIGN KEY (supervisor_id) REFERENCES employees(id),
    CONSTRAINT fk_visit_schedules_client FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Adicionar colunas à tabela visits se não existirem (apenas se a tabela existir)
DO $$ 
BEGIN
    -- Verificar se a tabela visits existe antes de tentar alterá-la
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='visits') THEN
        -- visit_schedule_id
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visits' AND column_name='visit_schedule_id') THEN
            ALTER TABLE visits ADD COLUMN visit_schedule_id UUID;
            ALTER TABLE visits ADD CONSTRAINT fk_visits_visit_schedule FOREIGN KEY (visit_schedule_id) REFERENCES visit_schedules(id);
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
    END IF;
END $$;

-- Adicionar colunas à tabela units se não existirem
DO $$ 
BEGIN
    -- latitude
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='units' AND column_name='latitude') THEN
        ALTER TABLE units ADD COLUMN latitude DOUBLE PRECISION;
    END IF;
    
    -- longitude
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='units' AND column_name='longitude') THEN
        ALTER TABLE units ADD COLUMN longitude DOUBLE PRECISION;
    END IF;
    
    -- address_city
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='units' AND column_name='address_city') THEN
        ALTER TABLE units ADD COLUMN address_city VARCHAR(100);
    END IF;
    
    -- address_state
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='units' AND column_name='address_state') THEN
        ALTER TABLE units ADD COLUMN address_state VARCHAR(2);
    END IF;
    
    -- address_zip_code
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='units' AND column_name='address_zip_code') THEN
        ALTER TABLE units ADD COLUMN address_zip_code VARCHAR(10);
    END IF;
END $$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_visit_schedules_supervisor_date ON visit_schedules(supervisor_id, schedule_date);
CREATE INDEX IF NOT EXISTS idx_visit_schedules_client_date ON visit_schedules(client_id, schedule_date);
CREATE INDEX IF NOT EXISTS idx_visit_schedules_status ON visit_schedules(status);
CREATE INDEX IF NOT EXISTS idx_visit_schedules_date_range ON visit_schedules(schedule_date);

-- Criar índices para visits apenas se a tabela existir
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
