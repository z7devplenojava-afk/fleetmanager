-- Ferias Coletivas (CLT Art. 139/140) e extensao da tabela vacations
-- para suportar fracionamento (Art. 134 1), abono pecuniario (Art. 143)
-- e vinculacao com o Periodo Aquisitivo.

CREATE TABLE IF NOT EXISTS ferias_coletivas (
    id UUID PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    dias_duracao INT NOT NULL,
    abrange_toda_empresa BOOLEAN NOT NULL DEFAULT TRUE,
    departamento_ids JSONB,
    company_id UUID,
    unit_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'Planejado',
    created_by UUID,
    observacoes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_ferias_coletivas_datas CHECK (data_fim >= data_inicio),
    CONSTRAINT chk_ferias_coletivas_duracao CHECK (dias_duracao > 0),
    CONSTRAINT chk_ferias_coletivas_status CHECK (status IN ('Planejado', 'Em Andamento', 'Concluido', 'Cancelado'))
);

CREATE INDEX IF NOT EXISTS idx_ferias_coletivas_periodo ON ferias_coletivas(data_inicio, data_fim);
CREATE INDEX IF NOT EXISTS idx_ferias_coletivas_status ON ferias_coletivas(status);

-- Extensao de vacations
ALTER TABLE vacations ADD COLUMN IF NOT EXISTS periodo_aquisitivo_id UUID;
ALTER TABLE vacations ADD COLUMN IF NOT EXISTS ferias_coletivas_id UUID;
ALTER TABLE vacations ADD COLUMN IF NOT EXISTS solicitante_id UUID;
ALTER TABLE vacations ADD COLUMN IF NOT EXISTS blocos JSONB;
ALTER TABLE vacations ADD COLUMN IF NOT EXISTS dias_abono INT NOT NULL DEFAULT 0;
ALTER TABLE vacations ADD COLUMN IF NOT EXISTS dias_licenca_remunerada INT NOT NULL DEFAULT 0;
ALTER TABLE vacations ADD COLUMN IF NOT EXISTS data_pagamento DATE;
ALTER TABLE vacations ADD COLUMN IF NOT EXISTS motivo_rejeicao TEXT;
ALTER TABLE vacations ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE vacations ADD COLUMN IF NOT EXISTS numero_blocos INT NOT NULL DEFAULT 1;

ALTER TABLE vacations
    ADD CONSTRAINT fk_vacations_periodo_aquisitivo
    FOREIGN KEY (periodo_aquisitivo_id) REFERENCES periodo_aquisitivo(id);

ALTER TABLE vacations
    ADD CONSTRAINT fk_vacations_ferias_coletivas
    FOREIGN KEY (ferias_coletivas_id) REFERENCES ferias_coletivas(id);

CREATE INDEX IF NOT EXISTS idx_vacations_periodo_aquisitivo_id ON vacations(periodo_aquisitivo_id);
CREATE INDEX IF NOT EXISTS idx_vacations_ferias_coletivas_id ON vacations(ferias_coletivas_id);
CREATE INDEX IF NOT EXISTS idx_vacations_start_date ON vacations(start_date);
