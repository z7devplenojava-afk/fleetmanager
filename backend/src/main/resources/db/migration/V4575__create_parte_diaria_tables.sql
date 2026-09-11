-- Migration V4575: Módulo de Parte Diária e Integração com Medições (PRD 1.1)

CREATE TABLE IF NOT EXISTS parte_diaria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    number VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    contract_id UUID REFERENCES measurement_contracts(id) ON DELETE SET NULL,
    obra_name VARCHAR(255),
    service_name VARCHAR(150),
    route_name VARCHAR(150),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    vehicle_plate VARCHAR(20) NOT NULL,
    vehicle_model VARCHAR(100),
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    driver_name VARCHAR(150),
    start_time VARCHAR(20),
    end_time VARCHAR(20),
    start_km NUMERIC(12, 2) DEFAULT 0.00,
    end_km NUMERIC(12, 2) DEFAULT 0.00,
    driven_km NUMERIC(12, 2) DEFAULT 0.00,
    disregarded_km NUMERIC(12, 2) DEFAULT 0.00,
    considered_km NUMERIC(12, 2) DEFAULT 0.00,
    disregard_reason VARCHAR(255),
    status VARCHAR(50) DEFAULT 'LANÇADA', -- RASCUNHO, LANÇADA, EM_CONFERENCIA, VALIDADA, REJEITADA, CANCELADA
    notes TEXT,
    created_by VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parte_diaria_atividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parte_diaria_id UUID NOT NULL REFERENCES parte_diaria(id) ON DELETE CASCADE,
    start_time VARCHAR(20),
    end_time VARCHAR(20),
    description TEXT NOT NULL,
    activity_type VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_parte_diaria_date ON parte_diaria(date);
CREATE INDEX IF NOT EXISTS idx_parte_diaria_contract ON parte_diaria(contract_id);
CREATE INDEX IF NOT EXISTS idx_parte_diaria_vehicle ON parte_diaria(vehicle_plate);
CREATE INDEX IF NOT EXISTS idx_parte_diaria_status ON parte_diaria(status);
