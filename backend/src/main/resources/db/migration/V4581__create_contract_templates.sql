-- PRD 1.0 - MÓDULO 2: Gestão de Propostas Comerciais & Minutas Contratuais
-- RF-02.1: três modelos contratuais parametrizáveis com cláusulas obrigatórias

CREATE TABLE IF NOT EXISTS contract_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) NOT NULL,
    -- FRANCHISE_KM | DEDICATED_ROUTES | DRY_LEASE
    template_type VARCHAR(50) NOT NULL,
    description TEXT,

    -- Corpo da minuta com placeholders {{variavel}}
    body TEXT NOT NULL,

    -- Cláusulas obrigatórias (RF-02.2), cada uma com placeholders
    adjustment_clause TEXT,             -- Reajuste anual IGP-M/IPCA
    diesel_trigger_clause TEXT,         -- Reequilíbrio econômico-financeiro (diesel > 5%)
    pmp_payment_clause TEXT,            -- Pagamento normal em dias parados para PMP
    measurement_clause TEXT,            -- Prazos de medição (dia 20, 5 dias úteis, 15-30 dias)
    retention_clause TEXT,              -- Retenção técnica de caução e liberação

    -- Parâmetros padrão aplicados na geração
    default_retention_pct NUMERIC(6,4) DEFAULT 0.0300,  -- Caução técnica (ex.: 3%)
    default_adjustment_index VARCHAR(20) DEFAULT 'IGP-M',
    default_payment_days INTEGER DEFAULT 30,
    diesel_trigger_pct NUMERIC(6,4) DEFAULT 0.0500,     -- Gatilho de reequilíbrio (5%)

    -- Gestão
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- PRD 1.0 - MÓDULO 2: versões/minutas geradas a partir de um template
CREATE TABLE IF NOT EXISTS contract_templates_generated (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL,

    -- Destino da minuta
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    cost_simulation_id UUID REFERENCES cost_simulations(id) ON DELETE SET NULL,

    -- Identificação
    reference_number VARCHAR(100),
    title VARCHAR(255) NOT NULL,

    -- Conteúdo final renderizado
    rendered_body TEXT NOT NULL,
    rendered_clauses TEXT,

    -- Preenchimento das partes (qualificação completa)
    contractor_name VARCHAR(255),
    contractor_cnpj VARCHAR(30),
    contractor_address TEXT,
    client_name VARCHAR(255),
    client_cnpj VARCHAR(30),
    client_address TEXT,
    elected_forum VARCHAR(255),

    -- Dados econômicos vigentes na assinatura
    monthly_price NUMERIC(15,2),
    franchise_km NUMERIC(12,2),
    excess_km_rate NUMERIC(10,4),
    daily_rate NUMERIC(15,2),
    extra_trip_rate NUMERIC(15,2),
    retention_pct NUMERIC(6,4),
    adjustment_index VARCHAR(20),

    -- RF-02.3: versionamento e assinatura
    version INTEGER NOT NULL DEFAULT 1,
    signature_provider VARCHAR(50),      -- DocuSign, Gov.br
    signed_at TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',  -- DRAFT, SENT, SIGNED, CANCELLED

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_templates_type ON contract_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_contract_generated_client ON contract_templates_generated(client_id);
CREATE INDEX IF NOT EXISTS idx_contract_generated_simulation ON contract_templates_generated(cost_simulation_id);

-- PRD Módulo 2: vincula proposta à simulação de custos que a originou (M1 → M2)
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS cost_simulation_id UUID REFERENCES cost_simulations(id) ON DELETE SET NULL;
