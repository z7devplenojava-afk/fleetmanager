-- PRD 1.0 - MÓDULO 3: Gestão Operacional, Tráfego & Mobilização
-- RF-03.5: blocos de Parte Diária com numeração sequencial distribuídos aos motoristas

CREATE TABLE IF NOT EXISTS daily_log_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    book_number VARCHAR(50) NOT NULL UNIQUE,        -- Nº do bloco (ex.: TAL-2026-0001)
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    vehicle_plate VARCHAR(20),

    first_number INTEGER NOT NULL,                  -- Primeira folha do bloco
    last_number INTEGER NOT NULL,                   -- Última folha do bloco
    current_number INTEGER NOT NULL,                -- Próxima folha a ser usada

    -- Distribuição (M3: alocação de frota e motoristas)
    assigned_driver_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    assigned_driver_name VARCHAR(255),
    assigned_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    assigned_work_post_id UUID REFERENCES work_posts(id) ON DELETE SET NULL,

    issued_at TIMESTAMP,                            -- Data de emissão/distribuição
    issued_by VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',   -- ACTIVE, EXHAUSTED, CANCELLED, LOST

    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT chk_book_range CHECK (last_number >= first_number)
);

CREATE INDEX IF NOT EXISTS idx_daily_log_books_vehicle ON daily_log_books(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_daily_log_books_driver ON daily_log_books(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_daily_log_books_status ON daily_log_books(status);

-- Registro de consumo de folhas (rastreabilidade talão → Parte Diária)
CREATE TABLE IF NOT EXISTS daily_log_book_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    book_id UUID NOT NULL REFERENCES daily_log_books(id) ON DELETE CASCADE,
    sequential_number INTEGER NOT NULL,             -- Nº de controle sequencial do talão (RF-05.1)
    daily_log_id UUID REFERENCES daily_logs(id) ON DELETE SET NULL,

    used_at TIMESTAMP,
    used_by VARCHAR(255),

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_book_entry UNIQUE (book_id, sequential_number)
);

CREATE INDEX IF NOT EXISTS idx_book_entries_book ON daily_log_book_entries(book_id);
CREATE INDEX IF NOT EXISTS idx_book_entries_daily_log ON daily_log_book_entries(daily_log_id);

-- PRD MÓDULO 3 (RF-03.3): Laudo de Vistoria de Mobilização
CREATE TABLE IF NOT EXISTS mobilization_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    registry_number VARCHAR(50) NOT NULL UNIQUE,    -- Nº do laudo
    inspection_date DATE NOT NULL,

    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    vehicle_plate VARCHAR(20) NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_name VARCHAR(255),
    contract_number VARCHAR(100),

    -- Quilometragem no ato da vistoria
    current_mileage INTEGER,

    -- Checklist digital (RF-03.3)
    bodywork_ok BOOLEAN NOT NULL DEFAULT TRUE,      -- Estado da lataria
    bodywork_notes TEXT,
    tires_ok BOOLEAN NOT NULL DEFAULT TRUE,
    tires_notes TEXT,
    tachograph_ok BOOLEAN NOT NULL DEFAULT TRUE,    -- Tacógrafo
    warning_triangle_ok BOOLEAN NOT NULL DEFAULT TRUE, -- Triângulo
    wheel_wrench_ok BOOLEAN NOT NULL DEFAULT TRUE,  -- Chave de roda
    reverse_alarm_ok BOOLEAN NOT NULL DEFAULT TRUE, -- Alarme de ré
    crlv_attached BOOLEAN NOT NULL DEFAULT FALSE,   -- Cópia do CRLV anexada

    photos_urls TEXT,                               -- Fotos do veículo (URLs separadas por vírgula)
    general_notes TEXT,

    -- Assinaturas (assinado em conjunto com o cliente)
    inspector_name VARCHAR(255),
    inspector_signature TEXT,
    client_representative_name VARCHAR(255),
    client_representative_signature TEXT,

    approved BOOLEAN NOT NULL DEFAULT FALSE,

    company_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mob_inspections_vehicle ON mobilization_inspections(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_mob_inspections_client ON mobilization_inspections(client_id);

-- PRD MÓDULO 3 (RF-03.1): critérios de elegibilidade da frota por contrato
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS has_retarder BOOLEAN;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS has_telemetry BOOLEAN;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS has_seat_belts_all BOOLEAN;

-- PRD MÓDULO 3 (RF-03.5): vínculo da Parte Diária com a folha do talão
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS book_id UUID REFERENCES daily_log_books(id) ON DELETE SET NULL;
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS book_sequential_number INTEGER;
