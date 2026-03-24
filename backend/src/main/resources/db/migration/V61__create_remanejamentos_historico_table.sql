-- Migration para criar tabela de histórico de remanejamentos
-- V200__create_remanejamentos_historico_table.sql

CREATE TABLE IF NOT EXISTS remanejamentos_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    remanejamento_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    origem VARCHAR(255),
    destino VARCHAR(255),
    data_remanejamento TIMESTAMP NOT NULL,
    observacao VARCHAR(500),
    acao_realizada VARCHAR(50) NOT NULL,
    usuario_que_executou UUID,
    data_execucao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dados_anteriores TEXT,
    dados_novos TEXT,
    motivo_alteracao VARCHAR(500),
    ip_usuario VARCHAR(45),
    user_agent TEXT,
    
    -- Constraints
    -- CONSTRAINT fk_remanejamentos_historico_remanejamento 
    --     FOREIGN KEY (remanejamento_id) REFERENCES remanejamentos(id) ON DELETE CASCADE,
    CONSTRAINT fk_remanejamentos_historico_employee 
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_remanejamentos_historico_usuario 
        FOREIGN KEY (usuario_que_executou) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Constraints para enum
    CONSTRAINT chk_remanejamentos_historico_tipo 
        CHECK (tipo IN ('TRANSFERENCIA_UNIDADE', 'TROCA_FUNCAO', 'PROMOCAO', 'OUTROS')),
    CONSTRAINT chk_remanejamentos_historico_acao 
        CHECK (acao_realizada IN ('CRIACAO', 'EDICAO', 'EXCLUSAO', 'ATIVACAO', 'DESATIVACAO', 'APROVACAO', 'REJEICAO', 'CANCELAMENTO'))
);

-- Índices para melhor performance
CREATE INDEX idx_remanejamentos_historico_remanejamento_id ON remanejamentos_historico(remanejamento_id);
CREATE INDEX idx_remanejamentos_historico_employee_id ON remanejamentos_historico(employee_id);
CREATE INDEX idx_remanejamentos_historico_usuario_id ON remanejamentos_historico(usuario_que_executou);
CREATE INDEX idx_remanejamentos_historico_data_execucao ON remanejamentos_historico(data_execucao DESC);
CREATE INDEX idx_remanejamentos_historico_acao ON remanejamentos_historico(acao_realizada);
CREATE INDEX idx_remanejamentos_historico_tipo ON remanejamentos_historico(tipo);
CREATE INDEX idx_remanejamentos_historico_data_remanejamento ON remanejamentos_historico(data_remanejamento);

-- Índice composto para consultas frequentes
CREATE INDEX idx_remanejamentos_historico_employee_data ON remanejamentos_historico(employee_id, data_execucao DESC);
CREATE INDEX idx_remanejamentos_historico_remanejamento_data ON remanejamentos_historico(remanejamento_id, data_execucao DESC);

-- Comentários para documentação
COMMENT ON TABLE remanejamentos_historico IS 'Tabela para armazenar histórico completo de auditoria de remanejamentos';
COMMENT ON COLUMN remanejamentos_historico.id IS 'ID único do registro de histórico';
COMMENT ON COLUMN remanejamentos_historico.remanejamento_id IS 'Referência ao remanejamento original';
COMMENT ON COLUMN remanejamentos_historico.employee_id IS 'Referência ao funcionário remanejado';
COMMENT ON COLUMN remanejamentos_historico.tipo IS 'Tipo do remanejamento (TRANSFERENCIA_UNIDADE, TROCA_FUNCAO, PROMOCAO, OUTROS)';
COMMENT ON COLUMN remanejamentos_historico.origem IS 'Local/função de origem do remanejamento';
COMMENT ON COLUMN remanejamentos_historico.destino IS 'Local/função de destino do remanejamento';
COMMENT ON COLUMN remanejamentos_historico.data_remanejamento IS 'Data em que o remanejamento foi efetivado';
COMMENT ON COLUMN remanejamentos_historico.observacao IS 'Observações sobre o remanejamento';
COMMENT ON COLUMN remanejamentos_historico.acao_realizada IS 'Tipo de ação realizada (CRIACAO, EDICAO, EXCLUSAO, etc.)';
COMMENT ON COLUMN remanejamentos_historico.usuario_que_executou IS 'Usuário que realizou a ação';
COMMENT ON COLUMN remanejamentos_historico.data_execucao IS 'Data e hora em que a ação foi executada';
COMMENT ON COLUMN remanejamentos_historico.dados_anteriores IS 'Dados do remanejamento antes da alteração (JSON)';
COMMENT ON COLUMN remanejamentos_historico.dados_novos IS 'Dados do remanejamento após a alteração (JSON)';
COMMENT ON COLUMN remanejamentos_historico.motivo_alteracao IS 'Motivo da alteração registrada';
COMMENT ON COLUMN remanejamentos_historico.ip_usuario IS 'Endereço IP do usuário que executou a ação';
COMMENT ON COLUMN remanejamentos_historico.user_agent IS 'User-Agent do navegador/aplicação que executou a ação'; 