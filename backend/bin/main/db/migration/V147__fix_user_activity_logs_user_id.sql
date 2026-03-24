-- Migration: V266__fix_user_activity_logs_user_id.sql
-- Corrigir a coluna user_id da tabela user_activity_logs para UUID

-- 1. Adicionar a coluna se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_activity_logs' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE user_activity_logs ADD COLUMN user_id UUID;
    END IF;
END $$;

-- 2. Alterar a coluna para UUID se não for
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_activity_logs' AND column_name = 'user_id' AND data_type != 'uuid'
    ) THEN
        ALTER TABLE user_activity_logs ALTER COLUMN user_id TYPE UUID USING 
            CASE 
                WHEN user_id IS NOT NULL THEN user_id::text::UUID
                ELSE NULL
            END;
    END IF;
END $$;

-- 3. (Opcional) Recriar a constraint de FK se necessário
-- Exemplo:
-- ALTER TABLE user_activity_logs ADD CONSTRAINT fk_user_activity_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 4. Verificar se a alteração foi bem-sucedida
DO $$
BEGIN
    RAISE NOTICE 'Verificando alterações na tabela user_activity_logs...';
    
    -- Verificar tipo da coluna
    PERFORM column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'user_activity_logs' 
    AND column_name = 'user_id';
    
    RAISE NOTICE 'Alteração concluída com sucesso!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro durante a migração: %', SQLERRM;
        RAISE;
END $$; 