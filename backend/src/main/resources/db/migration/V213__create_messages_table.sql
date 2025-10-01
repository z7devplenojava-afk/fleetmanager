-- Migração para criar a tabela de mensagens
-- V203__create_messages_table.sql

CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    sender_id UUID NOT NULL,
    recipient_id UUID,
    recipient_group_id BIGINT,
    type VARCHAR(20) NOT NULL DEFAULT 'INDIVIDUAL',
    status VARCHAR(20) NOT NULL DEFAULT 'UNREAD',
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    read_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_recipient_group FOREIGN KEY (recipient_group_id) REFERENCES user_groups(id) ON DELETE CASCADE,
    CONSTRAINT chk_messages_type CHECK (type IN ('INDIVIDUAL', 'GROUP', 'GLOBAL')),
    CONSTRAINT chk_messages_status CHECK (status IN ('UNREAD', 'READ', 'ARCHIVED')),
    CONSTRAINT chk_messages_priority CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT'))
);

-- Índices para melhor performance
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_recipient_group_id ON messages(recipient_group_id);
CREATE INDEX idx_messages_type ON messages(type);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_sender_created_at ON messages(sender_id, created_at);
CREATE INDEX idx_messages_recipient_status ON messages(recipient_id, status);

-- Comentários na tabela
COMMENT ON TABLE messages IS 'Tabela para armazenar mensagens do sistema';
COMMENT ON COLUMN messages.id IS 'ID único da mensagem';
COMMENT ON COLUMN messages.title IS 'Título da mensagem';
COMMENT ON COLUMN messages.content IS 'Conteúdo da mensagem';
COMMENT ON COLUMN messages.sender_id IS 'ID do usuário remetente';
COMMENT ON COLUMN messages.recipient_id IS 'ID do usuário destinatário (para mensagens individuais)';
COMMENT ON COLUMN messages.recipient_group_id IS 'ID do grupo destinatário (para mensagens de grupo)';
COMMENT ON COLUMN messages.type IS 'Tipo da mensagem: INDIVIDUAL, GROUP, GLOBAL';
COMMENT ON COLUMN messages.status IS 'Status da mensagem: UNREAD, READ, ARCHIVED';
COMMENT ON COLUMN messages.priority IS 'Prioridade da mensagem: LOW, NORMAL, HIGH, URGENT';
COMMENT ON COLUMN messages.created_at IS 'Data de criação da mensagem';
COMMENT ON COLUMN messages.read_at IS 'Data de leitura da mensagem';
COMMENT ON COLUMN messages.updated_at IS 'Data de atualização da mensagem'; 