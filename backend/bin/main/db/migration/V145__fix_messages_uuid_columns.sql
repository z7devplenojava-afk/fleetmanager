-- Migration: V264__fix_messages_uuid_columns.sql
-- Corrigir especificamente as colunas UUID da tabela messages

-- 1. Primeiro, remover as foreign key constraints existentes
ALTER TABLE messages DROP CONSTRAINT IF EXISTS fk_messages_sender;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS fk_messages_recipient;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS fk_messages_recipient_group;

-- 2. Alterar as colunas para UUID
-- Para sender_id (deve ser UUID já que users.id é UUID)
ALTER TABLE messages ALTER COLUMN sender_id TYPE UUID USING 
    CASE 
        WHEN sender_id IS NOT NULL THEN sender_id::text::UUID
        ELSE NULL
    END;

-- Para recipient_id (deve ser UUID já que users.id é UUID)
ALTER TABLE messages ALTER COLUMN recipient_id TYPE UUID USING 
    CASE 
        WHEN recipient_id IS NOT NULL THEN recipient_id::text::UUID
        ELSE NULL
    END;

-- Para recipient_group_id (deve ser UUID já que user_groups.id é UUID)
ALTER TABLE messages ALTER COLUMN recipient_group_id TYPE UUID USING 
    CASE 
        WHEN recipient_group_id IS NOT NULL THEN recipient_group_id::text::UUID
        ELSE NULL
    END;

-- 3. Recriar as foreign key constraints
ALTER TABLE messages ADD CONSTRAINT fk_messages_sender 
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE messages ADD CONSTRAINT fk_messages_recipient 
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE messages ADD CONSTRAINT fk_messages_recipient_group 
    FOREIGN KEY (recipient_group_id) REFERENCES user_groups(id) ON DELETE CASCADE;

-- 4. Verificar se a alteração foi bem-sucedida
DO $$
BEGIN
    RAISE NOTICE 'Verificando alterações na tabela messages...';
    
    -- Verificar tipos das colunas
    PERFORM column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name IN ('sender_id', 'recipient_id', 'recipient_group_id');
    
    RAISE NOTICE 'Alterações concluídas com sucesso!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro durante a migração: %', SQLERRM;
        RAISE;
END $$; 