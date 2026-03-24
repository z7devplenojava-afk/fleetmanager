-- Adicionar colunas que estão faltando na tabela messages (se não existirem)
DO $$
BEGIN
    -- Adicionar send_email se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'send_email') THEN
        ALTER TABLE messages ADD COLUMN send_email BOOLEAN DEFAULT false;
    END IF;
    
    -- Adicionar send_notification se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'send_notification') THEN
        ALTER TABLE messages ADD COLUMN send_notification BOOLEAN DEFAULT true;
    END IF;
    
    -- Adicionar scheduled_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'scheduled_at') THEN
        ALTER TABLE messages ADD COLUMN scheduled_at TIMESTAMP;
    END IF;
    
    -- Adicionar sent_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'sent_at') THEN
        ALTER TABLE messages ADD COLUMN sent_at TIMESTAMP;
    END IF;
END $$;

-- Criar tabelas de relacionamento que estão faltando
CREATE TABLE IF NOT EXISTS message_recipients (
    message_id UUID NOT NULL,
    user_id UUID NOT NULL,
    PRIMARY KEY (message_id, user_id),
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS message_departments (
    message_id UUID NOT NULL,
    department_id UUID NOT NULL,
    PRIMARY KEY (message_id, department_id),
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- Criar índices para as novas colunas (se não existirem)
CREATE INDEX IF NOT EXISTS idx_messages_scheduled ON messages(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_messages_sent ON messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_message_recipients_user ON message_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_message_departments_dept ON message_departments(department_id); 