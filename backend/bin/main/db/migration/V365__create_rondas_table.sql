-- Criação da tabela de rondas
CREATE TABLE IF NOT EXISTS rondas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(20) NOT NULL DEFAULT 'PREVENTIVA',
    prioridade VARCHAR(20) NOT NULL DEFAULT 'MEDIA',
    status VARCHAR(20) NOT NULL DEFAULT 'AGENDADA',
    data_inicio TIMESTAMP NOT NULL,
    data_fim TIMESTAMP NOT NULL,
    duracao_estimada INTEGER,
    duracao_real INTEGER,
    responsavel_id UUID NOT NULL,
    supervisor_id UUID,
    local_id UUID NOT NULL,
    endereco VARCHAR(500),
    observacoes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    FOREIGN KEY (responsavel_id) REFERENCES employees(id) ON DELETE RESTRICT,
    FOREIGN KEY (supervisor_id) REFERENCES employees(id) ON DELETE SET NULL,
    FOREIGN KEY (local_id) REFERENCES work_posts(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_rondas_tipo CHECK (tipo IN ('PREVENTIVA', 'PATRULHAMENTO', 'VIGILANCIA', 'EMERGENCIA', 'ESPECIAL')),
    CONSTRAINT chk_rondas_prioridade CHECK (prioridade IN ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA')),
    CONSTRAINT chk_rondas_status CHECK (status IN ('AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA', 'ATRASADA'))
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_rondas_status ON rondas(status);
CREATE INDEX IF NOT EXISTS idx_rondas_tipo ON rondas(tipo);
CREATE INDEX IF NOT EXISTS idx_rondas_prioridade ON rondas(prioridade);
CREATE INDEX IF NOT EXISTS idx_rondas_responsavel_id ON rondas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_rondas_supervisor_id ON rondas(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_rondas_local_id ON rondas(local_id);
CREATE INDEX IF NOT EXISTS idx_rondas_data_inicio ON rondas(data_inicio);
CREATE INDEX IF NOT EXISTS idx_rondas_data_fim ON rondas(data_fim);
CREATE INDEX IF NOT EXISTS idx_rondas_created_at ON rondas(created_at);

-- Comentários nas colunas
COMMENT ON TABLE rondas IS 'Tabela para controle de rondas de segurança';
COMMENT ON COLUMN rondas.tipo IS 'Tipo da ronda: PREVENTIVA, PATRULHAMENTO, VIGILANCIA, EMERGENCIA, ESPECIAL';
COMMENT ON COLUMN rondas.prioridade IS 'Prioridade da ronda: BAIXA, MEDIA, ALTA, CRITICA';
COMMENT ON COLUMN rondas.status IS 'Status da ronda: AGENDADA, EM_ANDAMENTO, CONCLUIDA, CANCELADA, ATRASADA';
COMMENT ON COLUMN rondas.duracao_estimada IS 'Duração estimada em minutos';
COMMENT ON COLUMN rondas.duracao_real IS 'Duração real em minutos (preenchido ao concluir)';

