-- Periodo Aquisitivo (PA) - CLT Art. 129 a 137
-- 12 meses em que o colaborador adquire o direito as ferias + 12 meses de periodo concessivo.
CREATE TABLE IF NOT EXISTS periodo_aquisitivo (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    limite_concessivo DATE NOT NULL,
    dias_direito INT NOT NULL DEFAULT 30,
    dias_saldo INT NOT NULL DEFAULT 30,
    dias_utilizados INT NOT NULL DEFAULT 0,
    faltas_injustificadas INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'EM_ANDAMENTO',
    origem VARCHAR(20) NOT NULL DEFAULT 'ADMISSAO',
    resetado_por_coletiva BOOLEAN NOT NULL DEFAULT FALSE,
    observacoes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_periodo_aquisitivo_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
    CONSTRAINT chk_periodo_aquisitivo_status CHECK (status IN ('EM_ANDAMENTO', 'CONCESSIVO', 'QUITADO', 'EXPIRADO')),
    CONSTRAINT chk_periodo_aquisitivo_origem CHECK (origem IN ('ADMISSAO', 'COLETIVA', 'RETORNO_AFASTAMENTO', 'MANUAL')),
    CONSTRAINT chk_periodo_aquisitivo_datas CHECK (data_fim > data_inicio),
    CONSTRAINT chk_periodo_aquisitivo_concessivo CHECK (limite_concessivo > data_fim),
    CONSTRAINT chk_periodo_aquisitivo_saldo CHECK (dias_saldo >= 0)
);

CREATE INDEX IF NOT EXISTS idx_periodo_aquisitivo_employee_id ON periodo_aquisitivo(employee_id);
CREATE INDEX IF NOT EXISTS idx_periodo_aquisitivo_status ON periodo_aquisitivo(status);
CREATE INDEX IF NOT EXISTS idx_periodo_aquisitivo_data_fim ON periodo_aquisitivo(data_fim);
CREATE INDEX IF NOT EXISTS idx_periodo_aquisitivo_limite_concessivo ON periodo_aquisitivo(limite_concessivo);
CREATE INDEX IF NOT EXISTS idx_periodo_aquisitivo_employee_status ON periodo_aquisitivo(employee_id, status);

-- Um unico PA vigente por colaborador por data (evita duplicidade no reset/backfill)
CREATE UNIQUE INDEX IF NOT EXISTS uq_periodo_aquisitivo_vigente
    ON periodo_aquisitivo(employee_id, data_inicio);
