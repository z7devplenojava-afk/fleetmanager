-- =============================================================================
-- V4559__create_contract_retentions_table.sql
-- Descrição: Tabela para Controle de Retenção Contratual (Garantia/Retenção por Medição)
-- =============================================================================

CREATE TABLE IF NOT EXISTS contract_retentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    unit_id UUID REFERENCES units(id),
    client_id UUID REFERENCES clients(id),
    contract_id UUID REFERENCES contracts(id),
    measurement_id UUID REFERENCES measurement_bulletins(id),
    reference_month VARCHAR(20),
    measured_value DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    rmu_discount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    retention_rate DECIMAL(5,2) NOT NULL DEFAULT 3.00,
    retention_value DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    net_invoiced_value DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'RETIDO',
    expected_release_date DATE,
    actual_release_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contract_retentions_company ON contract_retentions(company_id);
CREATE INDEX IF NOT EXISTS idx_contract_retentions_client ON contract_retentions(client_id);
CREATE INDEX IF NOT EXISTS idx_contract_retentions_contract ON contract_retentions(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_retentions_measurement ON contract_retentions(measurement_id);
CREATE INDEX IF NOT EXISTS idx_contract_retentions_status ON contract_retentions(status);
