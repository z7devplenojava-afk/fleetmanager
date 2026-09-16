-- PRD 1.0 - MÓDULO 1: Engenharia de Custos, Orçamento & Precificação Paramétrica
-- Cria tabela de simulações de custo paramétricas

CREATE TABLE IF NOT EXISTS cost_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificação
    name VARCHAR(255) NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,

    -- Categoria do veículo (Ônibus Rodoviário com Ar, Micro-ônibus, Van Sprinter)
    vehicle_category VARCHAR(50) NOT NULL,

    -- Regime de turnos (1 = ADM, 2 e 3 = regime de turno)
    driver_count INTEGER NOT NULL DEFAULT 1 CHECK (driver_count BETWEEN 1 AND 3),

    -- Dias operacionais no mês (22, 26 ou 30)
    operating_days INTEGER NOT NULL DEFAULT 22 CHECK (operating_days BETWEEN 1 AND 31),

    -- Cotação do diesel (R$/litro)
    diesel_price NUMERIC(10,4) NOT NULL,

    -- Parâmetros de mão de obra
    base_salary NUMERIC(15,2) NOT NULL,                 -- Piso salarial da CCT
    payroll_charges_pct NUMERIC(6,4) NOT NULL DEFAULT 0.7000, -- Encargos sociais (60% a 85%)
    meal_allowance NUMERIC(15,2) NOT NULL DEFAULT 0,    -- Ticket alimentação (R$/mês)
    health_plan_cost NUMERIC(15,2) NOT NULL DEFAULT 0,  -- Plano de saúde/odonto (R$/mês)

    -- Parâmetros de KM
    daily_km NUMERIC(10,2) NOT NULL,                    -- Extensão do trajeto (km/dia)
    productivity_factor NUMERIC(6,4) NOT NULL DEFAULT 1.1000, -- Margem KM improdutiva (10%)
    maintenance_per_km NUMERIC(10,4) NOT NULL DEFAULT 0,
    tires_per_km NUMERIC(10,4) NOT NULL DEFAULT 0,
    lubricants_per_km NUMERIC(10,4) NOT NULL DEFAULT 0,
    parts_per_km NUMERIC(10,4) NOT NULL DEFAULT 0,

    -- Custos fixos adicionais mensais (depreciação, licenciamento, seguro, rastreador, etc.)
    fixed_costs NUMERIC(15,2) NOT NULL DEFAULT 0,

    -- Tributos e margens
    iss_pct NUMERIC(6,4) NOT NULL DEFAULT 0.0500,
    icms_pct NUMERIC(6,4) NOT NULL DEFAULT 0.1044,
    pis_pct NUMERIC(6,4) NOT NULL DEFAULT 0.0065,
    cofins_pct NUMERIC(6,4) NOT NULL DEFAULT 0.0300,
    irpj_pct NUMERIC(6,4) NOT NULL DEFAULT 0.0240,
    csll_pct NUMERIC(6,4) NOT NULL DEFAULT 0.0108,
    profit_margin_pct NUMERIC(6,4) NOT NULL DEFAULT 0.1000, -- Margem de lucro
    bdi_pct NUMERIC(6,4) NOT NULL DEFAULT 0,           -- BDI sobre tarifas
    extra_trip_margin_pct NUMERIC(6,4) NOT NULL DEFAULT 0.1500, -- Margem da viagem extra (15%)

    -- Resultados calculados
    fixed_driver_cost NUMERIC(15,2),
    total_fixed_cost NUMERIC(15,2),
    variable_cost_per_km NUMERIC(10,4),
    franchise_km NUMERIC(12,2),
    total_monthly_cost NUMERIC(15,2),
    monthly_price NUMERIC(15,2),
    daily_rate NUMERIC(15,2),
    excess_km_rate NUMERIC(10,4),
    extra_trip_rate NUMERIC(15,2),
    taxes_total_pct NUMERIC(6,4),

    -- Gestão
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',        -- DRAFT, PENDING_APPROVAL, APPROVED, REJECTED
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    approval_notes TEXT,
    notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cost_simulations_client ON cost_simulations(client_id);
CREATE INDEX IF NOT EXISTS idx_cost_simulations_status ON cost_simulations(status);
