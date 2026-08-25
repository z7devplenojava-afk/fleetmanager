-- Migration: Campos documentais, financiamento, seguro, cliente e gestão de agregado
-- Data: 2026-08-25

-- =====================================================================
-- CAMPOS DOCUMENTAIS (Chassi, RENAVAN)
-- =====================================================================
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS chassis_number VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS renavan VARCHAR(50);

COMMENT ON COLUMN vehicles.chassis_number IS 'Número do chassi do veículo';
COMMENT ON COLUMN vehicles.renavan IS 'Número do RENAVAN';

-- =====================================================================
-- CAMPOS DE FINANCIAMENTO
-- =====================================================================
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS financing_status VARCHAR(30);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS financing_installment_value DECIMAL(12,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS financing_remaining_installments INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS financing_payoff_balance DECIMAL(14,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS financing_bank_or_institution VARCHAR(200);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS financing_contract_number VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS financing_start_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS financing_end_date DATE;

COMMENT ON COLUMN vehicles.financing_status IS 'Status do financiamento: OWNED, FINANCED, LEASED, RENTED';
COMMENT ON COLUMN vehicles.financing_installment_value IS 'Valor da parcela do financiamento';
COMMENT ON COLUMN vehicles.financing_remaining_installments IS 'Parcelas restantes do financiamento';
COMMENT ON COLUMN vehicles.financing_payoff_balance IS 'Saldo para quitação do financiamento';
COMMENT ON COLUMN vehicles.financing_bank_or_institution IS 'Banco ou instituição financeira';
COMMENT ON COLUMN vehicles.financing_contract_number IS 'Número do contrato de financiamento';
COMMENT ON COLUMN vehicles.financing_start_date IS 'Data de início do financiamento';
COMMENT ON COLUMN vehicles.financing_end_date IS 'Data de término do financiamento';

-- =====================================================================
-- CAMPOS DE VALOR DE MERCADO
-- =====================================================================
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS market_value DECIMAL(14,2);

COMMENT ON COLUMN vehicles.market_value IS 'Valor de mercado atual do veículo';

-- =====================================================================
-- CAMPOS DE SEGURO
-- =====================================================================
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_policy_number VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_company VARCHAR(200);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_premium_value DECIMAL(12,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_coverage_type VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_second_policy_number VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_second_company VARCHAR(200);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_second_premium_value DECIMAL(12,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_second_expiry_date DATE;

COMMENT ON COLUMN vehicles.insurance_policy_number IS 'Número da apólice de seguro principal';
COMMENT ON COLUMN vehicles.insurance_company IS 'Seguradora principal';
COMMENT ON COLUMN vehicles.insurance_premium_value IS 'Valor do prêmio do seguro principal';
COMMENT ON COLUMN vehicles.insurance_coverage_type IS 'Tipo de cobertura do seguro';
COMMENT ON COLUMN vehicles.insurance_second_policy_number IS 'Número da segunda apólice de seguro';
COMMENT ON COLUMN vehicles.insurance_second_company IS 'Segundadora segunda seguradora';
COMMENT ON COLUMN vehicles.insurance_second_premium_value IS 'Valor do prêmio da segunda apólice';
COMMENT ON COLUMN vehicles.insurance_second_expiry_date IS 'Data de vencimento da segunda apólice';

-- =====================================================================
-- CAMPOS DE CLIENTE / ALOCAÇÃO
-- =====================================================================
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS client_name VARCHAR(200);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS allocation_contract_number VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS allocation_start_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS allocation_end_date DATE;

COMMENT ON COLUMN vehicles.client_name IS 'Nome do cliente onde o veículo está alocado';
COMMENT ON COLUMN vehicles.client_id IS 'ID do cliente (FK)';
COMMENT ON COLUMN vehicles.allocation_contract_number IS 'Número do contrato de alocação';
COMMENT ON COLUMN vehicles.allocation_start_date IS 'Data de início da alocação';
COMMENT ON COLUMN vehicles.allocation_end_date IS 'Data de término da alocação';

-- =====================================================================
-- CAMPOS DE GESTÃO DE AGREGADO
-- =====================================================================
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_aggregated BOOLEAN DEFAULT FALSE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS aggregated_owner_name VARCHAR(200);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS aggregated_owner_cpf_cnpj VARCHAR(20);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS aggregated_owner_phone VARCHAR(20);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS aggregated_owner_email VARCHAR(200);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS aggregated_daily_rate DECIMAL(10,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS aggregated_monthly_rate DECIMAL(12,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS aggregated_payment_type VARCHAR(30);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS aggregated_contract_start_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS aggregated_contract_end_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS aggregated_notes TEXT;

COMMENT ON COLUMN vehicles.is_aggregated IS 'Se o veículo é de um agregado (não é da empresa)';
COMMENT ON COLUMN vehicles.aggregated_owner_name IS 'Nome do proprietário do veículo agregado';
COMMENT ON COLUMN vehicles.aggregated_owner_cpf_cnpj IS 'CPF ou CNPJ do proprietário agregado';
COMMENT ON COLUMN vehicles.aggregated_owner_phone IS 'Telefone do proprietário agregado';
COMMENT ON COLUMN vehicles.aggregated_owner_email IS 'E-mail do proprietário agregado';
COMMENT ON COLUMN vehicles.aggregated_daily_rate IS 'Valor diário cobrado pelo agregado';
COMMENT ON COLUMN vehicles.aggregated_monthly_rate IS 'Valor mensal cobrado pelo agregado';
COMMENT ON COLUMN vehicles.aggregated_payment_type IS 'Tipo de pagamento: DAILY, MONTHLY, PER_TRIP, PERCENTAGE';
COMMENT ON COLUMN vehicles.aggregated_contract_start_date IS 'Data de início do contrato com agregado';
COMMENT ON COLUMN vehicles.aggregated_contract_end_date IS 'Data de término do contrato com agregado';
COMMENT ON COLUMN vehicles.aggregated_notes IS 'Observações sobre o agregado';

-- =====================================================================
-- CAMPO DE DIFERENÇA FINANCEIRA
-- =====================================================================
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS financial_difference DECIMAL(14,2);

COMMENT ON COLUMN vehicles.financial_difference IS 'Diferença entre valor de mercado e saldo de financiamento';

-- =====================================================================
-- ÍNDICES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_vehicles_financing_status ON vehicles(financing_status);
CREATE INDEX IF NOT EXISTS idx_vehicles_is_aggregated ON vehicles(is_aggregated);
CREATE INDEX IF NOT EXISTS idx_vehicles_client_id ON vehicles(client_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_client_name ON vehicles(client_name);
