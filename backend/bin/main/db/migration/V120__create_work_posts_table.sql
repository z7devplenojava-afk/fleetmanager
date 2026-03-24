-- Migration: V232__create_work_posts_table.sql
-- Description: Create work_posts table and related enums

-- Create WorkPostType enum
CREATE TYPE work_post_type AS ENUM (
    'POSTO_24H',
    'POSTO_12H_DIURNO',
    'POSTO_12H_NOTURNO',
    'POSTO_8H_DIURNO',
    'POSTO_8H_NOTURNO',
    'POSTO_SDF',
    'POSTO_ESPECIAL'
);

-- Create WorkPostStatus enum
CREATE TYPE work_post_status AS ENUM (
    'EM_IMPLANTACAO',
    'ATIVO',
    'INATIVO',
    'SUSPENSO',
    'CANCELADO',
    'EM_ANALISE',
    'PENDENTE'
);

-- Create work_posts table
CREATE TABLE work_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type work_post_type NOT NULL,
    status work_post_status NOT NULL DEFAULT 'EM_IMPLANTACAO',
    
    -- Location
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    
    -- Relationships
    client_id UUID NOT NULL REFERENCES clients(id),
    contract_id UUID REFERENCES contracts(id),
    responsible_id UUID REFERENCES users(id),
    
    -- Personnel Configuration
    required_vigilantes INTEGER NOT NULL,
    work_schedule VARCHAR(50) NOT NULL,
    shift_start TIME NOT NULL,
    shift_end TIME NOT NULL,
    shift_description VARCHAR(100),
    
    -- Benefits and Conditions
    transport_voucher BOOLEAN DEFAULT FALSE,
    cost_allowance BOOLEAN DEFAULT FALSE,
    cost_allowance_value DECIMAL(10,2),
    intrajourney BOOLEAN DEFAULT FALSE,
    local_meal BOOLEAN DEFAULT FALSE,
    meal_ticket BOOLEAN DEFAULT FALSE,
    health_plan BOOLEAN DEFAULT FALSE,
    dental_plan BOOLEAN DEFAULT FALSE,
    
    -- Resources and Equipment
    cars INTEGER DEFAULT 0,
    motorcycles INTEGER DEFAULT 0,
    radios INTEGER DEFAULT 0,
    corporates INTEGER DEFAULT 0,
    document_bank BOOLEAN DEFAULT FALSE,
    
    -- Legal Compliance
    pgr BOOLEAN DEFAULT FALSE,
    pcmso BOOLEAN DEFAULT FALSE,
    
    -- Implementation
    implementation_date DATE,
    implementation_time TIME,
    observations TEXT,
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create collection tables for ElementCollection
CREATE TABLE work_post_nrs (
    work_post_id UUID NOT NULL,
    nr VARCHAR(100) NOT NULL,
    PRIMARY KEY (work_post_id, nr),
    FOREIGN KEY (work_post_id) REFERENCES work_posts(id) ON DELETE CASCADE
);

CREATE TABLE work_post_epis (
    work_post_id UUID NOT NULL,
    epi VARCHAR(100) NOT NULL,
    PRIMARY KEY (work_post_id, epi),
    FOREIGN KEY (work_post_id) REFERENCES work_posts(id) ON DELETE CASCADE
);

CREATE TABLE work_post_trainings (
    work_post_id UUID NOT NULL,
    training VARCHAR(100) NOT NULL,
    PRIMARY KEY (work_post_id, training),
    FOREIGN KEY (work_post_id) REFERENCES work_posts(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_work_posts_client_id ON work_posts(client_id);
CREATE INDEX idx_work_posts_contract_id ON work_posts(contract_id);
CREATE INDEX idx_work_posts_responsible_id ON work_posts(responsible_id);
CREATE INDEX idx_work_posts_status ON work_posts(status);
CREATE INDEX idx_work_posts_type ON work_posts(type);
CREATE INDEX idx_work_posts_post_code ON work_posts(post_code);
CREATE INDEX idx_work_posts_city ON work_posts(city);
CREATE INDEX idx_work_posts_state ON work_posts(state);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_work_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_work_posts_updated_at
    BEFORE UPDATE ON work_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_work_posts_updated_at(); 