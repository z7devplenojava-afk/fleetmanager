-- Migration para criar tabela de logs de exclusão de mensagens
-- V269: Create message_deletion_logs table

CREATE TABLE IF NOT EXISTS message_deletion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL,
    message_title VARCHAR(255),
    deleted_by_user_id UUID NOT NULL,
    deletion_reason TEXT NOT NULL,
    deleted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    
    -- Foreign key para o usuário que deletou
    CONSTRAINT fk_message_deletion_log_user
        FOREIGN KEY (deleted_by_user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_message_deletion_log_message_id 
    ON message_deletion_logs(message_id);

CREATE INDEX IF NOT EXISTS idx_message_deletion_log_deleted_by 
    ON message_deletion_logs(deleted_by_user_id);

CREATE INDEX IF NOT EXISTS idx_message_deletion_log_deleted_at 
    ON message_deletion_logs(deleted_at DESC);

-- Comentários para documentação
COMMENT ON TABLE message_deletion_logs IS 'Logs de exclusão de mensagens com motivo';
COMMENT ON COLUMN message_deletion_logs.message_id IS 'ID da mensagem deletada';
COMMENT ON COLUMN message_deletion_logs.message_title IS 'Título da mensagem deletada (para histórico)';
COMMENT ON COLUMN message_deletion_logs.deleted_by_user_id IS 'ID do usuário que deletou a mensagem';
COMMENT ON COLUMN message_deletion_logs.deletion_reason IS 'Motivo fornecido para a exclusão';
COMMENT ON COLUMN message_deletion_logs.deleted_at IS 'Data e hora da exclusão';
COMMENT ON COLUMN message_deletion_logs.ip_address IS 'Endereço IP de onde foi feita a exclusão';
