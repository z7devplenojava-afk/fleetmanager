-- ====================================================================
-- V4713: Arquitetura SaaS Multi-Tenant, Billing Guard e Contratos em 2 Níveis
-- ====================================================================

-- 1. Tabela de Planos e Funcionalidades (Feature Flags)
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL DEFAULT 0,
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'monthly', 'yearly'
    max_users INTEGER DEFAULT 50,
    max_vehicles INTEGER DEFAULT 30,
    features JSONB NOT NULL DEFAULT '{}', -- Ex: {"contracts_white_label": true, "telemetry": true, "maintenance_advanced": true}
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir planos padrão se não existirem
INSERT INTO plans (id, name, description, price_cents, billing_cycle, max_users, max_vehicles, features)
VALUES 
    ('11111111-1111-1111-1111-111111111101', 'Essencial Frotas', 'Plano para pequenas operações e transporte escolar/fretamento direto.', 49000, 'monthly', 15, 10, '{"contracts_white_label": false, "telemetry": false, "maintenance_advanced": false}'),
    ('11111111-1111-1111-1111-111111111102', 'Profissional Viação', 'Plano completo para médias e grandes viações com manutenção e contratos.', 129000, 'monthly', 60, 45, '{"contracts_white_label": true, "telemetry": true, "maintenance_advanced": true}'),
    ('11111111-1111-1111-1111-111111111103', 'Enterprise FluxBus', 'Plano corporativo ilimitado com integração ERP, BI e múltiplos centros de custo.', 299000, 'monthly', 300, 250, '{"contracts_white_label": true, "telemetry": true, "maintenance_advanced": true, "unlimited_reports": true}')
ON CONFLICT (id) DO NOTHING;

-- 2. Atualizar tabela de Empresas (Companies / Tenants) com campos de Assinatura e Ciclo Financeiro
ALTER TABLE companies 
    ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(30) NOT NULL DEFAULT 'active', -- 'trialing', 'active', 'past_due', 'canceled', 'suspended'
    ADD COLUMN IF NOT EXISTS due_date DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
    ADD COLUMN IF NOT EXISTS grace_period_days INTEGER NOT NULL DEFAULT 5,
    ADD COLUMN IF NOT EXISTS gateway_customer_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS gateway_subscription_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS legal_representative JSONB DEFAULT NULL;

-- Vincular empresas existentes ao plano padrão Profissional se estiverem sem plano
UPDATE companies 
SET plan_id = '11111111-1111-1111-1111-111111111102',
    subscription_status = 'active',
    due_date = COALESCE(due_date, CURRENT_DATE + INTERVAL '30 days')
WHERE plan_id IS NULL;

-- 3. Tabela de Logs de Webhooks e Eventos Financeiros (Idempotência)
CREATE TABLE IF NOT EXISTS billing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    gateway_event_id VARCHAR(150) NOT NULL,
    gateway_name VARCHAR(50) NOT NULL DEFAULT 'ASAAS', -- 'ASAAS', 'STRIPE', 'PAGARME'
    event_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    amount_cents INTEGER,
    payload TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uk_billing_events_gateway_id UNIQUE (gateway_name, gateway_event_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_events_company_id ON billing_events(company_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_created_at ON billing_events(created_at);

-- 4. Tabela de Usuários Multi-Tenant (Vínculo N:N para operadores em múltiplas empresas)
CREATE TABLE IF NOT EXISTS tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uk_tenant_users_company_user UNIQUE (company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_users_company_id ON tenant_users(company_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_employee_id ON tenant_users(employee_id);

-- Popular tenant_users inicialmente com usuários existentes que possuem company_id
INSERT INTO tenant_users (company_id, user_id, role, status)
SELECT 
    u.company_id, 
    u.id, 
    COALESCE(
        (SELECT r.name 
         FROM user_roles ur 
         JOIN roles r ON r.id = ur.role_id 
         WHERE ur.user_id = u.id 
         ORDER BY CASE 
             WHEN r.name = 'COMPANY_ADMIN' THEN 1 
             WHEN r.name = 'ADMIN' THEN 2 
             ELSE 3 
         END 
         LIMIT 1), 
        'COLABORADOR'
    ) AS role, 
    'ACTIVE'
FROM users u
WHERE u.company_id IS NOT NULL
ON CONFLICT (company_id, user_id) DO NOTHING;

-- 5. Atualizar Contratos para Modelo de 2 Níveis e Imutabilidade Jurídica
ALTER TABLE contract_templates
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS scope_level VARCHAR(30) NOT NULL DEFAULT 'TENANT_CLIENT'; -- 'PLATFORM_SAAS' (Nível 1) ou 'TENANT_CLIENT' (Nível 2)

-- Criar índice para templates globais vs templates por tenant
CREATE INDEX IF NOT EXISTS idx_contract_templates_company_scope ON contract_templates(company_id, scope_level);

-- Inserir Template Global Nível 1 de Licença SaaS se não existir
INSERT INTO contract_templates (id, name, template_type, scope_level, company_id, description, body, is_active)
VALUES (
    '22222222-2222-2222-2222-222222222201',
    'Termo de Adesão e Licenciamento SaaS FluxBus (Nível 1)',
    'CONTRATO_FRETAMENTO_CONTINUO',
    'PLATFORM_SAAS',
    NULL,
    'Template Global de Licenciamento de Uso da Plataforma FluxBus pelas Empresas de Transporte',
    '<h1>TERMO DE ADESÃO E LICENCIAMENTO DE SOFTWARE SAAS - FLUXBUS</h1><p>Pelo presente instrumento, a <strong>FLUXBUS TECNOLOGIA LTDA</strong> disponibiliza à Contratante <strong>{{company_name}}</strong> (CNPJ: {{company_cnpj}}), sediada em {{company_address}}, os direitos de uso da plataforma FluxBus pelo Plano <strong>{{plan_name}}</strong>.</p><p>Valor mensal: R$ {{plan_price}}. Dia de vencimento: {{due_day}} de cada mês.</p>',
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- 6. Adicionar campos de auditoria e imutabilidade na tabela de contratos gerados
ALTER TABLE contract_templates_generated
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS scope_level VARCHAR(30) NOT NULL DEFAULT 'TENANT_CLIENT',
    ADD COLUMN IF NOT EXISTS storage_key VARCHAR(500),
    ADD COLUMN IF NOT EXISTS sha256_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS accepted_by_user_id UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS acceptance_metadata JSONB,
    ADD COLUMN IF NOT EXISTS pdf_url TEXT;

CREATE INDEX IF NOT EXISTS idx_generated_contracts_company ON contract_templates_generated(company_id);
CREATE INDEX IF NOT EXISTS idx_generated_contracts_sha256 ON contract_templates_generated(sha256_hash);
