-- Migration V4568: Tabelas de Apreciação de Riscos (HRN) e Inspeções/Laudos com Liberação de Veículo

CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    vehicle_plate VARCHAR(20),
    equipment_tag VARCHAR(100),
    company_name VARCHAR(200),
    department VARCHAR(100),
    brand VARCHAR(100),
    model VARCHAR(100),
    power_hp INTEGER,
    pbt_kg INTEGER,
    energy_type VARCHAR(100),
    usage_context TEXT,
    assessment_date DATE NOT NULL,
    revision_number INTEGER DEFAULT 1,
    technical_responsible_name VARCHAR(200),
    technical_responsible_crea VARCHAR(50),
    normative_references TEXT,
    methodology VARCHAR(100) DEFAULT 'HRN',
    
    -- Parâmetros HRN (LO x FE x DPH x NP)
    lo_value DECIMAL(8,2) DEFAULT 1.0, -- Likelihood of Occurrence
    fe_value DECIMAL(8,2) DEFAULT 1.0, -- Frequency of Exposure
    dph_value DECIMAL(8,2) DEFAULT 1.0, -- Degree of Possible Harm
    np_value DECIMAL(8,2) DEFAULT 1.0, -- Number of Persons at risk
    hrn_score DECIMAL(10,2) DEFAULT 1.0,
    risk_classification VARCHAR(50), -- INSIGNIFICANTE, BAIXO, MEDIO, ALTO, MUITO_ALTO, EXTREMO
    
    identified_risks TEXT,
    applied_controls TEXT,
    evidences TEXT,
    conclusion TEXT,
    
    technical_signature TEXT,
    supervisor_signature TEXT,
    
    company_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicle_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registry_number VARCHAR(50) NOT NULL UNIQUE,
    inspection_type VARCHAR(50) NOT NULL, -- LAUDO, INSPECAO_TECNICA, VISTORIA
    inspection_date DATE NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    vehicle_plate VARCHAR(20),
    client_name VARCHAR(200),
    project_name VARCHAR(200),
    current_mileage INTEGER,
    requester_name VARCHAR(200),
    driver_name VARCHAR(200),
    
    anomalies_problem TEXT,
    occurrence_description TEXT,
    services_performed TEXT,
    parts_used TEXT,
    technical_parameters TEXT, -- ex: Torque 36-40 kgfm
    evidences_urls TEXT,
    result_notes TEXT,
    
    -- Liberação do Veículo (Seção 11 PRD)
    release_status VARCHAR(50) NOT NULL DEFAULT 'LIBERADO_SEM_RESTRICAO', -- LIBERADO_SEM_RESTRICAO, LIBERADO_COM_RESTRICAO, NAO_LIBERADO
    restriction_description TEXT,
    restriction_deadline DATE,
    restriction_responsible VARCHAR(200),
    definitive_release_condition TEXT,
    
    inspector_name VARCHAR(200),
    supervisor_name VARCHAR(200),
    inspector_signature TEXT,
    supervisor_signature TEXT,
    release_signature TEXT,
    
    company_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_vehicle ON risk_assessments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_vehicle ON vehicle_inspections(vehicle_id);
