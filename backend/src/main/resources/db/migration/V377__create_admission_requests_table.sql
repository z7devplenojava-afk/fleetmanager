-- Criar tabela de solicitações de admissão e demissão

CREATE TABLE IF NOT EXISTS admission_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('ADMISSION', 'DISMISSAL')),
    employee_name VARCHAR(255) NOT NULL,
    employee_cpf VARCHAR(20),
    employee_rg VARCHAR(20),
    employee_email VARCHAR(255),
    employee_phone VARCHAR(20),
    position VARCHAR(255),
    department VARCHAR(255),
    unit_id UUID,
    start_date DATE,
    end_date DATE,
    reason TEXT,
    justification TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED')),
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    request_date DATE NOT NULL,
    approval_date DATE,
    completion_date DATE,
    approved_by UUID,
    approved_by_name VARCHAR(255),
    approval_notes TEXT,
    rejected_by UUID,
    rejected_by_name VARCHAR(255),
    rejection_reason TEXT,
    requester_id UUID,
    requester_name VARCHAR(255),
    approver_id UUID,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar FKs com verificação de constraints existentes
DO $$
BEGIN
    -- Verificar se units.id tem PK/UNIQUE
    PERFORM 1
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    WHERE c.conrelid = 'units'::regclass
      AND a.attname = 'id'
      AND c.contype IN ('p','u');

    -- Só cria FK para units se existir PK/UNIQUE em units(id)
    IF EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
        WHERE c.conrelid = 'units'::regclass
          AND a.attname = 'id'
          AND c.contype IN ('p','u')
    ) THEN
        ALTER TABLE admission_requests
            ADD CONSTRAINT fk_admission_request_unit
            FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;
    ELSE
        RAISE NOTICE 'FK fk_admission_request_unit não criada: units.id não é UNIQUE/PK';
    END IF;

    -- Verificar se users.id tem PK/UNIQUE
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
        WHERE c.conrelid = 'users'::regclass
          AND a.attname = 'id'
          AND c.contype IN ('p','u')
    ) THEN
        RAISE NOTICE 'FKs de admission_requests para users não criadas: users.id não é UNIQUE/PK';
        RETURN;
    END IF;

    -- Demais FKs apontam para users(id) (se tiver PK/UNIQUE)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_admission_request_approved_by'
          AND conrelid = 'admission_requests'::regclass
    ) THEN
        ALTER TABLE admission_requests
            ADD CONSTRAINT fk_admission_request_approved_by
            FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_admission_request_rejected_by'
          AND conrelid = 'admission_requests'::regclass
    ) THEN
        ALTER TABLE admission_requests
            ADD CONSTRAINT fk_admission_request_rejected_by
            FOREIGN KEY (rejected_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_admission_request_requester'
          AND conrelid = 'admission_requests'::regclass
    ) THEN
        ALTER TABLE admission_requests
            ADD CONSTRAINT fk_admission_request_requester
            FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_admission_request_approver'
          AND conrelid = 'admission_requests'::regclass
    ) THEN
        ALTER TABLE admission_requests
            ADD CONSTRAINT fk_admission_request_approver
            FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_admission_requests_type ON admission_requests(type);
CREATE INDEX IF NOT EXISTS idx_admission_requests_status ON admission_requests(status);
CREATE INDEX IF NOT EXISTS idx_admission_requests_priority ON admission_requests(priority);
CREATE INDEX IF NOT EXISTS idx_admission_requests_request_date ON admission_requests(request_date);
CREATE INDEX IF NOT EXISTS idx_admission_requests_unit_id ON admission_requests(unit_id);
CREATE INDEX IF NOT EXISTS idx_admission_requests_requester_id ON admission_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_admission_requests_approver_id ON admission_requests(approver_id);

-- Comentários nas colunas
COMMENT ON TABLE admission_requests IS 'Tabela para armazenar solicitações de admissão e demissão de funcionários';
COMMENT ON COLUMN admission_requests.request_number IS 'Número único da solicitação (ex: ADM-2025-0001)';
COMMENT ON COLUMN admission_requests.type IS 'Tipo da solicitação: ADMISSION ou DISMISSAL';
COMMENT ON COLUMN admission_requests.status IS 'Status da solicitação: PENDING, APPROVED, REJECTED, COMPLETED, CANCELLED';
COMMENT ON COLUMN admission_requests.priority IS 'Prioridade da solicitação: LOW, MEDIUM, HIGH, URGENT';

