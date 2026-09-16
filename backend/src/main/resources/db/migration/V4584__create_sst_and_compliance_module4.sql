-- PRD 1.0 - MÓDULO 4: Gestão de RH, Departamento Pessoal & SST

-- RF-04.3: Laudo de Fumaça Preta / Opacidade (Escala Ringelmann)
-- Medições mensais para 100% dos veículos em operação na mina
CREATE TABLE IF NOT EXISTS opacity_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    test_date DATE NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    vehicle_plate VARCHAR(20) NOT NULL,

    -- Escala Ringelmann (0 a 5) — PRD exige registro mensal
    ringelmann_scale INTEGER NOT NULL CHECK (ringelmann_scale BETWEEN 0 AND 5),
    -- Resultado: APPROVED (≤2), RESTRICTED (3), DISAPPROVED (≥4)
    result VARCHAR(20) NOT NULL,

    -- Laboratório/empresa certificada responsável pela medição
    laboratory_name VARCHAR(255),
    certificate_number VARCHAR(100),
    certificate_expires_at DATE,

    report_url TEXT,
    notes TEXT,

    company_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- 1 medição por veículo/mês
    CONSTRAINT uq_opacity_vehicle_month UNIQUE (vehicle_id, test_date)
);

CREATE INDEX IF NOT EXISTS idx_opacity_tests_vehicle ON opacity_tests(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_opacity_tests_date ON opacity_tests(test_date);

-- RF-04.4: Dossiê Mensal de Conformidade (gerado 1-clique para anexo ao BM)
CREATE TABLE IF NOT EXISTS compliance_dossiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Período do dossiê (mês de referência)
    reference_month VARCHAR(7) NOT NULL,          -- 'YYYY-MM'
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,

    -- Checklist do kit mandatório (RF-04.4)
    payroll_summary_ok BOOLEAN NOT NULL DEFAULT FALSE,      -- Folha analítica e resumo
    payroll_deposit_ok BOOLEAN NOT NULL DEFAULT FALSE,      -- Comprovantes de depósito
    benefits_proof_ok BOOLEAN NOT NULL DEFAULT FALSE,       -- Ticket e Plano de Saúde
    fgts_guide_ok BOOLEAN NOT NULL DEFAULT FALSE,           -- Guia FGTS + comprovante
    inss_guide_ok BOOLEAN NOT NULL DEFAULT FALSE,           -- Guia GPS/INSS + comprovante
    cndt_ok BOOLEAN NOT NULL DEFAULT FALSE,                 -- Certidão Trabalhista
    cnd_fgts_ok BOOLEAN NOT NULL DEFAULT FALSE,             -- CND FGTS
    cnd_union_ok BOOLEAN NOT NULL DEFAULT FALSE,            -- CND Conjunta da União
    opacity_tests_ok BOOLEAN NOT NULL DEFAULT FALSE,        -- Laudos de Fumaça Preta do mês

    -- Metadados das evidências anexadas (JSON: item -> url)
    attachments TEXT,

    -- Validade das certidões
    cndt_valid_until DATE,
    cnd_fgts_valid_until DATE,
    cnd_union_valid_until DATE,

    -- Geração e aprovação
    generated_at TIMESTAMP,
    generated_by VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',  -- DRAFT, COMPLETE, ATTACHED_TO_BM
    notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT uq_dossier_period UNIQUE (reference_month, client_id)
);

CREATE INDEX IF NOT EXISTS idx_dossiers_client ON compliance_dossiers(client_id);
CREATE INDEX IF NOT EXISTS idx_dossiers_status ON compliance_dossiers(status);

-- RF-04.1: validação de condutores — EAR ativa e certidão de prontuário
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cnh_ear_active BOOLEAN DEFAULT FALSE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cnh_course_certificate_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS driver_record_certificate_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS driver_record_clean BOOLEAN DEFAULT FALSE;
