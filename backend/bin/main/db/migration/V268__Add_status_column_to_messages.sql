-- Migration para adicionar campo status na tabela messages
-- V268: Add status column to messages table

-- Adicionar coluna status se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE messages 
        ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'UNREAD';
        
        -- Atualizar registros existentes baseado no campo read_at
        UPDATE messages 
        SET status = CASE 
            WHEN read_at IS NOT NULL THEN 'READ'
            ELSE 'UNREAD'
        END;
        
        -- Adicionar constraint para valores válidos
        ALTER TABLE messages 
        ADD CONSTRAINT chk_message_status 
        CHECK (status IN ('UNREAD', 'READ', 'ARCHIVED'));
        
        -- Criar índice para performance
        CREATE INDEX idx_messages_status ON messages(status);
        
        -- Comentário para documentação
        COMMENT ON COLUMN messages.status IS 'Status da mensagem: UNREAD, READ, ARCHIVED';
    END IF;
END $$;
