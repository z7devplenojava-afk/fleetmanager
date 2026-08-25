-- Tabela de leads prospectados pelo Agent de Prospecção (Google Maps / Places)
CREATE TABLE IF NOT EXISTS prospected_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificação da empresa
    cnpj VARCHAR(20),
    company_name VARCHAR(255),
    trade_name VARCHAR(255),
    cnae VARCHAR(20),
    cnae_description VARCHAR(500),
    activity VARCHAR(255),

    -- Endereço
    address VARCHAR(500),
    neighborhood VARCHAR(255),
    city VARCHAR(255),
    state VARCHAR(50),
    cep VARCHAR(20),

    -- Contato
    phone VARCHAR(30),
    whatsapp VARCHAR(30),
    email VARCHAR(255),
    website VARCHAR(500),

    -- Sócios / decisores / compras
    partner_names TEXT,
    purchasing_contacts TEXT,

    -- Dados Google Maps
    google_place_id VARCHAR(100),
    google_rating DECIMAL(3,1),
    google_reviews INTEGER,
    google_types TEXT,

    -- Origem e busca
    source VARCHAR(50) NOT NULL DEFAULT 'GOOGLE_MAPS',
    search_term VARCHAR(500),

    -- Qualificação
    status VARCHAR(30) NOT NULL DEFAULT 'FOUND',
    qualification_score INTEGER,
    qualification_notes TEXT,

    -- Kanban
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para buscas frequentes
CREATE INDEX IF NOT EXISTS idx_prospected_leads_status ON prospected_leads(status);
CREATE INDEX IF NOT EXISTS idx_prospected_leads_city ON prospected_leads(city);
CREATE INDEX IF NOT EXISTS idx_prospected_leads_cnae ON prospected_leads(cnae);
CREATE INDEX IF NOT EXISTS idx_prospected_leads_cnpj ON prospected_leads(cnpj);
CREATE INDEX IF NOT EXISTS idx_prospected_leads_search_term ON prospected_leads(search_term);
