-- Migration para corrigir a estrutura da tabela visits para corresponder à entidade Visit

-- Primeiro, vamos fazer backup dos dados existentes
CREATE TABLE visits_backup AS SELECT * FROM visits;

-- Dropar a tabela visits existente
DROP TABLE IF EXISTS visits CASCADE;

-- Recriar a tabela visits com a estrutura correta
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supervisor_id UUID NOT NULL,
    work_post_id UUID NOT NULL,
    client_id UUID NOT NULL,
    visit_date DATE NOT NULL,
    visit_time TIME NOT NULL,
    description TEXT,
    observations TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location_address VARCHAR(500),
    qr_code_scanned VARCHAR(500),
    qr_code_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    visit_schedule_id UUID,
    
    -- Foreign Keys
    CONSTRAINT fk_visits_supervisor FOREIGN KEY (supervisor_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_visits_work_post FOREIGN KEY (work_post_id) REFERENCES work_posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_visits_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_visits_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_visits_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
    CONSTRAINT fk_visits_visit_schedule FOREIGN KEY (visit_schedule_id) REFERENCES visit_schedules(id),
    
    -- Check constraints
    CONSTRAINT chk_visits_status CHECK (status IN ('PENDING', 'COMPLETED', 'NOT_COMPLETED', 'CANCELLED'))
);

-- Criar tabelas para ElementCollection
CREATE TABLE visit_employees (
    visit_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    PRIMARY KEY (visit_id, employee_id),
    CONSTRAINT fk_visit_employees_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
);

CREATE TABLE visit_files (
    visit_id UUID NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    PRIMARY KEY (visit_id, file_path),
    CONSTRAINT fk_visit_files_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
);

CREATE TABLE visit_photos (
    visit_id UUID NOT NULL,
    photo_path VARCHAR(500) NOT NULL,
    PRIMARY KEY (visit_id, photo_path),
    CONSTRAINT fk_visit_photos_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_visits_supervisor_date ON visits(supervisor_id, visit_date DESC);
CREATE INDEX idx_visits_work_post_date ON visits(work_post_id, visit_date DESC);
CREATE INDEX idx_visits_client_date ON visits(client_id, visit_date DESC);
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_date ON visits(visit_date);
CREATE INDEX idx_visits_schedule ON visits(visit_schedule_id);

-- Comentários
COMMENT ON TABLE visits IS 'Tabela para controle de visitas dos supervisores aos postos de trabalho';
COMMENT ON COLUMN visits.visit_date IS 'Data da visita planejada ou realizada';
COMMENT ON COLUMN visits.visit_time IS 'Horário da visita';
COMMENT ON COLUMN visits.supervisor_id IS 'ID do supervisor responsável pela visita';
COMMENT ON COLUMN visits.work_post_id IS 'ID do posto de trabalho a ser visitado';
COMMENT ON COLUMN visits.client_id IS 'ID do cliente';
COMMENT ON COLUMN visits.status IS 'Status da visita: PENDING, COMPLETED, NOT_COMPLETED, CANCELLED';
COMMENT ON COLUMN visits.description IS 'Descrição da visita';
COMMENT ON COLUMN visits.observations IS 'Observações sobre a visita';
COMMENT ON COLUMN visits.latitude IS 'Latitude da localização da visita';
COMMENT ON COLUMN visits.longitude IS 'Longitude da localização da visita';
COMMENT ON COLUMN visits.location_address IS 'Endereço da localização da visita';
COMMENT ON COLUMN visits.qr_code_scanned IS 'Código QR escaneado durante a visita';
COMMENT ON COLUMN visits.qr_code_verified IS 'Indica se o código QR foi verificado';
