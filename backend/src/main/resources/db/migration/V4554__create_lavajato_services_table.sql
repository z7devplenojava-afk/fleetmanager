-- Tabela de serviços de lavajato (lavagem de veículos)
CREATE TABLE IF NOT EXISTS lavajato_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    driver_id UUID REFERENCES drivers(id),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    checklist_internal TEXT,
    checklist_external TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds BIGINT,
    observations TEXT,
    driver_phone VARCHAR(20),
    driver_user_id UUID,
    operator_id UUID,
    company_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_lavajato_vehicle_id ON lavajato_services(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_lavajato_status ON lavajato_services(status);
CREATE INDEX IF NOT EXISTS idx_lavajato_company_id ON lavajato_services(company_id);
CREATE INDEX IF NOT EXISTS idx_lavajato_created_at ON lavajato_services(created_at);
