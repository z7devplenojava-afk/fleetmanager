-- Criar tabela de reações de mensagens
-- Verificar se as tabelas necessárias existem antes de criar
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
        -- Criar tabela se não existir
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'message_reactions') THEN
            CREATE TABLE message_reactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                message_id UUID NOT NULL,
                user_id UUID NOT NULL,
                emoji VARCHAR(10) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                
                CONSTRAINT fk_message_reactions_message FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
                CONSTRAINT fk_message_reactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT uk_message_reactions_user_emoji UNIQUE (message_id, user_id, emoji)
            );
            
            -- Criar índices para melhor performance
            CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
            CREATE INDEX idx_message_reactions_user_id ON message_reactions(user_id);
            CREATE INDEX idx_message_reactions_emoji ON message_reactions(emoji);
            
            -- Comentários
            COMMENT ON TABLE message_reactions IS 'Tabela para armazenar reações (emoji) de mensagens de chat';
            COMMENT ON COLUMN message_reactions.id IS 'ID único da reação';
            COMMENT ON COLUMN message_reactions.message_id IS 'ID da mensagem reagida';
            COMMENT ON COLUMN message_reactions.user_id IS 'ID do usuário que reagiu';
            COMMENT ON COLUMN message_reactions.emoji IS 'Emoji da reação';
            COMMENT ON COLUMN message_reactions.created_at IS 'Data e hora da reação';
        ELSE
            -- Se a tabela já existe, apenas criar índices que ainda não existem
            CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
            CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);
            CREATE INDEX IF NOT EXISTS idx_message_reactions_emoji ON message_reactions(emoji);
        END IF;
    END IF;
END $$;

