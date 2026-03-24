-- Migração para criar tabelas de medição
-- V418__create_measurement_tables.sql

-- Criar tabela measurement_bulletins
CREATE TABLE IF NOT EXISTS measurement_bulletins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL DEFAULT 'PROMOVER VIGILANCIA PATRIMONIAL LTDA',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    contract_number VARCHAR(100) NOT NULL,
    contract_start DATE,
    contract_end DATE,
    nf_number VARCHAR(50),
    elaborated_by VARCHAR(255) NOT NULL,
    measured_by VARCHAR(255) NOT NULL,
    validated_by VARCHAR(255),
    checked_by VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    subtotal DECIMAL(15,2) DEFAULT 0.00,
    client_id UUID,
    contract_id UUID,
    unit_id UUID,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela measurement_items
CREATE TABLE IF NOT EXISTS measurement_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_number INTEGER NOT NULL,
    code VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    unit VARCHAR(50) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_value DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    cost_center_id VARCHAR(50),
    cost_center_name VARCHAR(100),
    bulletin_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela calculation_memories
CREATE TABLE IF NOT EXISTS calculation_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    details TEXT NOT NULL,
    evidence_path TEXT,
    month_reference VARCHAR(20),
    calculation_items JSONB,
    bulletin_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_measurement_bulletins_contract ON measurement_bulletins(contract_number);
CREATE INDEX IF NOT EXISTS idx_measurement_bulletins_period ON measurement_bulletins(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_measurement_bulletins_status ON measurement_bulletins(status);
CREATE INDEX IF NOT EXISTS idx_measurement_bulletins_client ON measurement_bulletins(client_id);

CREATE INDEX IF NOT EXISTS idx_measurement_items_bulletin ON measurement_items(bulletin_id);
CREATE INDEX IF NOT EXISTS idx_measurement_items_code ON measurement_items(code);

CREATE INDEX IF NOT EXISTS idx_calculation_memories_bulletin ON calculation_memories(bulletin_id);

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_measurement_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
DROP TRIGGER IF EXISTS trigger_update_measurement_bulletins_updated_at ON measurement_bulletins;
CREATE TRIGGER trigger_update_measurement_bulletins_updated_at
    BEFORE UPDATE ON measurement_bulletins
    FOR EACH ROW
    EXECUTE FUNCTION update_measurement_tables_updated_at();

DROP TRIGGER IF EXISTS trigger_update_measurement_items_updated_at ON measurement_items;
CREATE TRIGGER trigger_update_measurement_items_updated_at
    BEFORE UPDATE ON measurement_items
    FOR EACH ROW
    EXECUTE FUNCTION update_measurement_tables_updated_at();

DROP TRIGGER IF EXISTS trigger_update_calculation_memories_updated_at ON calculation_memories;
CREATE TRIGGER trigger_update_calculation_memories_updated_at
    BEFORE UPDATE ON calculation_memories
    FOR EACH ROW
    EXECUTE FUNCTION update_measurement_tables_updated_at();

-- Adicionar foreign keys se as tabelas referenciadas existirem
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') THEN
        BEGIN
            ALTER TABLE measurement_bulletins ADD CONSTRAINT fk_measurement_bulletins_client 
                FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN END;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'contracts') THEN
        BEGIN
            ALTER TABLE measurement_bulletins ADD CONSTRAINT fk_measurement_bulletins_contract 
                FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN END;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'units') THEN
        BEGIN
            ALTER TABLE measurement_bulletins ADD CONSTRAINT fk_measurement_bulletins_unit 
                FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN END;
    END IF;

    -- Adicionar foreign key para measurement_items
    BEGIN
        ALTER TABLE measurement_items ADD CONSTRAINT fk_measurement_items_bulletin 
            FOREIGN KEY (bulletin_id) REFERENCES measurement_bulletins(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN END;

    -- Adicionar foreign key para calculation_memories
    BEGIN
        ALTER TABLE calculation_memories ADD CONSTRAINT fk_calculation_memories_bulletin 
            FOREIGN KEY (bulletin_id) REFERENCES measurement_bulletins(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN END;
END $$;
