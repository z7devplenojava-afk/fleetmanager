-- Migration: Create ticket_messages table
-- Description: Tabela para armazenar mensagens/comentários dos tickets

CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255),
    is_support BOOLEAN NOT NULL DEFAULT FALSE,
    agent_id UUID REFERENCES support_agents(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_message_ticket FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_message_agent FOREIGN KEY (agent_id) REFERENCES support_agents(id) ON DELETE SET NULL
);

-- Índices para melhor performance
CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX idx_ticket_messages_agent_id ON ticket_messages(agent_id);
CREATE INDEX idx_ticket_messages_created_at ON ticket_messages(created_at DESC);
CREATE INDEX idx_ticket_messages_is_support ON ticket_messages(is_support);

-- Comentários
COMMENT ON TABLE ticket_messages IS 'Tabela para armazenar mensagens/comentários dos tickets';
COMMENT ON COLUMN ticket_messages.id IS 'ID único da mensagem';
COMMENT ON COLUMN ticket_messages.ticket_id IS 'Referência ao ticket';
COMMENT ON COLUMN ticket_messages.content IS 'Conteúdo da mensagem';
COMMENT ON COLUMN ticket_messages.sender_name IS 'Nome de quem enviou a mensagem';
COMMENT ON COLUMN ticket_messages.sender_email IS 'Email de quem enviou a mensagem';
COMMENT ON COLUMN ticket_messages.is_support IS 'Indica se a mensagem foi enviada pelo suporte';
COMMENT ON COLUMN ticket_messages.agent_id IS 'Agente que enviou a mensagem (se aplicável)';
COMMENT ON COLUMN ticket_messages.created_at IS 'Data e hora da mensagem';

