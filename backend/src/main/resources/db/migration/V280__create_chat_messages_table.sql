-- Verificar se a tabela já existe antes de criar
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
        CREATE TABLE chat_messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            content TEXT NOT NULL,
            sender_id UUID NOT NULL,
            recipient_id UUID,
            group_id UUID,
            department_id UUID,
            type VARCHAR(50) NOT NULL DEFAULT 'TEXT',
            is_read BOOLEAN DEFAULT false,
            read_at TIMESTAMP,
            edited_at TIMESTAMP,
            reply_to_id UUID,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE CASCADE,
            FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
            FOREIGN KEY (reply_to_id) REFERENCES chat_messages(id) ON DELETE SET NULL
        );

        -- Criar índices
        CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
        CREATE INDEX idx_chat_messages_recipient ON chat_messages(recipient_id);
        CREATE INDEX idx_chat_messages_group ON chat_messages(group_id);
        CREATE INDEX idx_chat_messages_department ON chat_messages(department_id);
        CREATE INDEX idx_chat_messages_type ON chat_messages(type);
        CREATE INDEX idx_chat_messages_read ON chat_messages(is_read);
        CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);
        CREATE INDEX idx_chat_messages_reply ON chat_messages(reply_to_id);

        -- Índice composto para conversas
        CREATE INDEX idx_chat_conversation ON chat_messages(sender_id, recipient_id, created_at);
    END IF;
END $$; 