-- ====================================
-- PRD: FECHAMENTO MENSAL DE HORAS
-- Fase 4: Banco de Horas
-- ====================================

-- Tabela: bank_hours (saldo de banco de horas por funcionário/contrato)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bank_hours') THEN
        CREATE TABLE bank_hours (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
            balance_hours NUMERIC(10,2) DEFAULT 0, -- Saldo atual de horas
            period_start_date DATE, -- Início do período de acumulação
            period_end_date DATE, -- Fim do período de acumulação
            expiration_date DATE, -- Data de vencimento do saldo (opcional)
            last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            -- Um funcionário pode ter apenas um saldo ativo por contrato
            CONSTRAINT unique_employee_contract UNIQUE (employee_id, contract_id)
        );
        
        CREATE INDEX idx_bank_hours_employee_id ON bank_hours(employee_id);
        CREATE INDEX idx_bank_hours_contract_id ON bank_hours(contract_id);
        CREATE INDEX idx_bank_hours_expiration_date ON bank_hours(expiration_date);
        
        COMMENT ON TABLE bank_hours IS 'Saldo de banco de horas por funcionário/contrato';
        COMMENT ON COLUMN bank_hours.balance_hours IS 'Saldo atual de horas (pode ser positivo ou negativo)';
        COMMENT ON COLUMN bank_hours.expiration_date IS 'Data de vencimento do saldo (NULL = sem vencimento)';
    END IF;
END $$;

-- Tabela: bank_hours_transaction (histórico de transações de banco de horas)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bank_hours_transaction') THEN
        CREATE TABLE bank_hours_transaction (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            bank_hours_id UUID NOT NULL REFERENCES bank_hours(id) ON DELETE CASCADE,
            transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('CREDIT', 'DEBIT')),
            hours NUMERIC(10,2) NOT NULL, -- Quantidade de horas
            source_type VARCHAR(50) NOT NULL, -- OVERTIME, COMPENSATION, ADJUSTMENT, PAYMENT, EXPIRATION
            source_payroll_closure_id UUID REFERENCES payroll_closures(id) ON DELETE SET NULL,
            description TEXT, -- Descrição da transação
            transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
            created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            
            -- Metadados adicionais
            metadata JSONB -- Dados adicionais em formato JSON (ex: período de origem)
        );
        
        CREATE INDEX idx_bank_hours_transaction_bank_hours_id ON bank_hours_transaction(bank_hours_id);
        CREATE INDEX idx_bank_hours_transaction_type ON bank_hours_transaction(transaction_type);
        CREATE INDEX idx_bank_hours_transaction_source_type ON bank_hours_transaction(source_type);
        CREATE INDEX idx_bank_hours_transaction_source_payroll ON bank_hours_transaction(source_payroll_closure_id);
        CREATE INDEX idx_bank_hours_transaction_date ON bank_hours_transaction(transaction_date);
        
        COMMENT ON TABLE bank_hours_transaction IS 'Histórico de transações de banco de horas para auditoria';
        COMMENT ON COLUMN bank_hours_transaction.transaction_type IS 'Tipo: CREDIT (acréscimo) ou DEBIT (uso/desconto)';
        COMMENT ON COLUMN bank_hours_transaction.source_type IS 'Origem: OVERTIME (horas extras), COMPENSATION (compensação), ADJUSTMENT (ajuste manual), PAYMENT (pagamento), EXPIRATION (vencimento)';
    END IF;
END $$;

-- Trigger para atualizar last_updated_at e updated_at em bank_hours
CREATE OR REPLACE FUNCTION update_bank_hours_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_at = CURRENT_TIMESTAMP;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'bank_hours_timestamps_trigger'
    ) THEN
        CREATE TRIGGER bank_hours_timestamps_trigger
        BEFORE UPDATE ON bank_hours
        FOR EACH ROW
        EXECUTE FUNCTION update_bank_hours_timestamps();
    END IF;
END $$;

-- Função para atualizar saldo de banco de horas automaticamente quando houver transação
-- (será chamada via service, mas podemos criar trigger se necessário)
CREATE OR REPLACE FUNCTION update_bank_hours_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_type = 'CREDIT' THEN
        UPDATE bank_hours 
        SET balance_hours = balance_hours + NEW.hours,
            last_updated_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.bank_hours_id;
    ELSIF NEW.transaction_type = 'DEBIT' THEN
        UPDATE bank_hours 
        SET balance_hours = balance_hours - NEW.hours,
            last_updated_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.bank_hours_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'bank_hours_transaction_balance_trigger'
    ) THEN
        CREATE TRIGGER bank_hours_transaction_balance_trigger
        AFTER INSERT ON bank_hours_transaction
        FOR EACH ROW
        EXECUTE FUNCTION update_bank_hours_balance();
    END IF;
END $$;

-- Adicionar permissões
INSERT INTO permissions (id, name, description) VALUES
(gen_random_uuid(), 'BANK_HOURS_READ', 'Visualizar banco de horas'),
(gen_random_uuid(), 'BANK_HOURS_MANAGE', 'Gerenciar banco de horas (adicionar, usar, ajustar)'),
(gen_random_uuid(), 'BANK_HOURS_TRANSACTION_READ', 'Visualizar transações de banco de horas')
ON CONFLICT (name) DO NOTHING;





