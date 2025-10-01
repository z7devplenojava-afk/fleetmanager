-- Migration para criar tabela de escalas de visitas
CREATE TABLE visit_schedules (
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

-- Índices para performance
CREATE INDEX idx_visit_schedules_supervisor_date ON visit_schedules(supervisor_id, schedule_date);
CREATE INDEX idx_visit_schedules_client_date ON visit_schedules(client_id, schedule_date);
CREATE INDEX idx_visit_schedules_status ON visit_schedules(status);
CREATE INDEX idx_visit_schedules_date_range ON visit_schedules(schedule_date);
