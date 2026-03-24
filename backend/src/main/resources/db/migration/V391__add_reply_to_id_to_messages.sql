-- Adicionar campo reply_to_id à tabela messages para suportar respostas
-- Verificar se a tabela messages existe antes de modificar
DO $$
BEGIN
    -- Verificar se a tabela messages existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
        -- Adicionar coluna se não existir
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'messages' AND column_name = 'reply_to_id'
        ) THEN
            ALTER TABLE messages ADD COLUMN reply_to_id UUID;
        END IF;
        
        -- Adicionar foreign key constraint apenas se não existir e se a tabela tem PRIMARY KEY
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_constraint 
            WHERE conname = 'fk_messages_reply_to'
        ) AND EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE table_name = 'messages' 
            AND constraint_type = 'PRIMARY KEY'
        ) THEN
            ALTER TABLE messages
            ADD CONSTRAINT fk_messages_reply_to 
            FOREIGN KEY (reply_to_id) REFERENCES messages(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- Criar índice para melhor performance em consultas de respostas
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON messages(reply_to_id);

-- Comentário na coluna
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
        COMMENT ON COLUMN messages.reply_to_id IS 'ID da mensagem original quando esta é uma resposta';
    END IF;
END $$;

