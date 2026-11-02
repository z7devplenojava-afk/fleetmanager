-- V4646__create_missing_entity_tables.sql
-- Criação das 9 tabelas de entidades JPA que não possuíam script de migração versionado

-- 1. Boarding Records (Registro de Embarque de Passageiros)
CREATE TABLE IF NOT EXISTS boarding_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passenger_id UUID NOT NULL,
    trip_id UUID NOT NULL,
    point_id UUID NOT NULL,
    boarding_time TIMESTAMP NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geofence_validated BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_boarding_records_passenger_id ON boarding_records(passenger_id);
CREATE INDEX IF NOT EXISTS idx_boarding_records_trip_id ON boarding_records(trip_id);
CREATE INDEX IF NOT EXISTS idx_boarding_records_point_id ON boarding_records(point_id);

-- 2. Charter Contracts (Contratos de Fretamento)
CREATE TABLE IF NOT EXISTS charter_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    client_id UUID,
    value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_charter_contracts_client_id ON charter_contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_charter_contracts_status ON charter_contracts(status);

-- 3. Employee Faces (Reconhecimento Facial de Funcionários)
CREATE TABLE IF NOT EXISTS employee_faces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    face_template BYTEA NOT NULL,
    face_encoding TEXT,
    face_quality_score DOUBLE PRECISION,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_employee_faces_employee_id ON employee_faces(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_faces_cpf ON employee_faces(cpf);

-- 4. Facial Recognition Config (Configurações de Reconhecimento Facial)
CREATE TABLE IF NOT EXISTS facial_recognition_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_facial_recognition_config_key ON facial_recognition_config(config_key);

-- 5. Facial Recognition Logs (Logs de Tentativas de Reconhecimento Facial)
CREATE TABLE IF NOT EXISTS facial_recognition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID,
    cpf VARCHAR(14),
    recognition_type VARCHAR(50) NOT NULL,
    confidence_score NUMERIC(5, 2),
    face_quality_score NUMERIC(5, 2),
    recognition_status VARCHAR(20) NOT NULL,
    error_message TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    location_latitude NUMERIC(10, 8),
    location_longitude NUMERIC(11, 8),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_facial_recognition_logs_employee_id ON facial_recognition_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_facial_recognition_logs_created_at ON facial_recognition_logs(created_at);

-- 6. File System Nodes (Nós do Sistema de Arquivos Virtual)
CREATE TABLE IF NOT EXISTS file_system_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    path VARCHAR(1000) NOT NULL,
    parent_path VARCHAR(1000),
    type VARCHAR(10) NOT NULL,
    size BIGINT,
    mime_type VARCHAR(100),
    physical_path VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);
CREATE INDEX IF NOT EXISTS idx_file_system_nodes_path ON file_system_nodes(path);
CREATE INDEX IF NOT EXISTS idx_file_system_nodes_parent_path ON file_system_nodes(parent_path);

-- 7. Fiscal Documents (Documentos Fiscais)
CREATE TABLE IF NOT EXISTS fiscal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_key VARCHAR(100) UNIQUE,
    number VARCHAR(100) NOT NULL,
    series VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    emission_date TIMESTAMP NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL,
    issuer_tax_id VARCHAR(50) NOT NULL,
    issuer_name VARCHAR(255) NOT NULL,
    recipient_tax_id VARCHAR(50),
    xml_path TEXT,
    pdf_path TEXT,
    notes TEXT,
    company_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_fiscal_documents_company_id ON fiscal_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_documents_doc_key ON fiscal_documents(doc_key);

-- 8. Supervisor Visits (Visitas de Supervisão e coleções associadas)
CREATE TABLE IF NOT EXISTS supervisor_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supervisor_id UUID NOT NULL,
    work_post_id UUID NOT NULL,
    client_id UUID NOT NULL,
    visit_date DATE NOT NULL,
    visit_time TIME NOT NULL,
    description TEXT,
    observations TEXT,
    status VARCHAR(50) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location_address VARCHAR(500),
    qr_code_scanned VARCHAR(255),
    qr_code_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_supervisor_visits_supervisor_id ON supervisor_visits(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_visits_work_post_id ON supervisor_visits(work_post_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_visits_client_id ON supervisor_visits(client_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_visits_visit_date ON supervisor_visits(visit_date);

CREATE TABLE IF NOT EXISTS supervisor_visit_employees (
    visit_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    CONSTRAINT fk_supervisor_visit_employees_visit FOREIGN KEY (visit_id) REFERENCES supervisor_visits(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS supervisor_visit_files (
    visit_id UUID NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    CONSTRAINT fk_supervisor_visit_files_visit FOREIGN KEY (visit_id) REFERENCES supervisor_visits(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS supervisor_visit_photos (
    visit_id UUID NOT NULL,
    photo_path VARCHAR(1000) NOT NULL,
    CONSTRAINT fk_supervisor_visit_photos_visit FOREIGN KEY (visit_id) REFERENCES supervisor_visits(id) ON DELETE CASCADE
);

-- 9. Trip Events (Eventos de Viagem e Rastreamento)
CREATE TABLE IF NOT EXISTS trip_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    observations TEXT,
    driver_id UUID,
    vehicle_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_trip_events_trip_id ON trip_events(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_events_driver_id ON trip_events(driver_id);
CREATE INDEX IF NOT EXISTS idx_trip_events_vehicle_id ON trip_events(vehicle_id);
