-- Criação da tabela de Controle de Visitas
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_date DATE NOT NULL,
    supervisor_id UUID NOT NULL,
    unit_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    observations TEXT,
    arrival_time TIMESTAMP,
    departure_time TIMESTAMP,
    security_check BOOLEAN DEFAULT FALSE,
    equipment_check BOOLEAN DEFAULT FALSE,
    staff_check BOOLEAN DEFAULT FALSE,
    procedure_check BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_visits_supervisor FOREIGN KEY (supervisor_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_visits_unit FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    
    -- Unique constraint para evitar múltiplas visitas no mesmo dia/setor/supervisor
    CONSTRAINT uk_visits_date_supervisor_unit UNIQUE (visit_date, supervisor_id, unit_id),
    
    -- Check constraints
    CONSTRAINT chk_visits_status CHECK (status IN ('PENDING', 'COMPLETED', 'NOT_COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_visits_times CHECK (departure_time IS NULL OR arrival_time IS NULL OR departure_time >= arrival_time)
);

-- Índices para performance
CREATE INDEX idx_visits_supervisor_date ON visits(supervisor_id, visit_date DESC);
CREATE INDEX idx_visits_unit_date ON visits(unit_id, visit_date DESC);
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_date ON visits(visit_date);
CREATE INDEX idx_visits_year_month ON visits(EXTRACT(YEAR FROM visit_date), EXTRACT(MONTH FROM visit_date));

-- Comentários
COMMENT ON TABLE visits IS 'Tabela para controle de visitas dos supervisores aos setores/unidades';
COMMENT ON COLUMN visits.visit_date IS 'Data da visita planejada ou realizada';
COMMENT ON COLUMN visits.supervisor_id IS 'ID do supervisor responsável pela visita';
COMMENT ON COLUMN visits.unit_id IS 'ID da unidade/setor a ser visitado';
COMMENT ON COLUMN visits.status IS 'Status da visita: PENDING, COMPLETED, NOT_COMPLETED, CANCELLED';
COMMENT ON COLUMN visits.observations IS 'Observações sobre a visita';
COMMENT ON COLUMN visits.arrival_time IS 'Horário de chegada na visita';
COMMENT ON COLUMN visits.departure_time IS 'Horário de saída da visita';
COMMENT ON COLUMN visits.security_check IS 'Verificação de segurança realizada';
COMMENT ON COLUMN visits.equipment_check IS 'Verificação de equipamentos realizada';
COMMENT ON COLUMN visits.staff_check IS 'Verificação de pessoal realizada';
COMMENT ON COLUMN visits.procedure_check IS 'Verificação de procedimentos realizada';
