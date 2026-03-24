-- Verificar se a tabela chat_messages existe e tem PRIMARY KEY antes de criar as tabelas
DO $$
BEGIN
    -- Verificar se a tabela chat_messages existe e tem PRIMARY KEY
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'chat_messages'
    ) AND EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'chat_messages' 
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
        -- Tabela para mensagens fixadas
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_message_pins') THEN
            CREATE TABLE chat_message_pins (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                message_id UUID NOT NULL,
                user_id UUID NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_pin_message FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
                CONSTRAINT fk_pin_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT uk_pin_message_user UNIQUE (message_id, user_id)
            );
            -- Criar índices
            CREATE INDEX idx_pin_message ON chat_message_pins(message_id);
            CREATE INDEX idx_pin_user ON chat_message_pins(user_id);
        ELSE
            -- Se a tabela já existe, apenas criar índices que ainda não existem
            CREATE INDEX IF NOT EXISTS idx_pin_message ON chat_message_pins(message_id);
            CREATE INDEX IF NOT EXISTS idx_pin_user ON chat_message_pins(user_id);
        END IF;

        -- Tabela para mensagens favoritas
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_message_favorites') THEN
            CREATE TABLE chat_message_favorites (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                message_id UUID NOT NULL,
                user_id UUID NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_favorite_message FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
                CONSTRAINT fk_favorite_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT uk_favorite_message_user UNIQUE (message_id, user_id)
            );
            -- Criar índices
            CREATE INDEX idx_favorite_message ON chat_message_favorites(message_id);
            CREATE INDEX idx_favorite_user ON chat_message_favorites(user_id);
        ELSE
            -- Se a tabela já existe, apenas criar índices que ainda não existem
            CREATE INDEX IF NOT EXISTS idx_favorite_message ON chat_message_favorites(message_id);
            CREATE INDEX IF NOT EXISTS idx_favorite_user ON chat_message_favorites(user_id);
        END IF;

        -- Tabela para denúncias de mensagens
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_message_reports') THEN
            CREATE TABLE chat_message_reports (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                message_id UUID NOT NULL,
                reporter_id UUID NOT NULL,
                reason TEXT NOT NULL,
                description TEXT,
                status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
                reviewed_by UUID,
                reviewed_at TIMESTAMP,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_report_message FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
                CONSTRAINT fk_report_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_report_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
            );
            -- Criar índices
            CREATE INDEX idx_report_message ON chat_message_reports(message_id);
            CREATE INDEX idx_report_reporter ON chat_message_reports(reporter_id);
            CREATE INDEX idx_report_status ON chat_message_reports(status);
        ELSE
            -- Se a tabela já existe, apenas criar índices que ainda não existem
            CREATE INDEX IF NOT EXISTS idx_report_message ON chat_message_reports(message_id);
            CREATE INDEX IF NOT EXISTS idx_report_reporter ON chat_message_reports(reporter_id);
            CREATE INDEX IF NOT EXISTS idx_report_status ON chat_message_reports(status);
        END IF;
    END IF;
END $$;

