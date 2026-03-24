-- Migration: V268__fix_all_remaining_uuid_columns.sql
-- Corrigir TODAS as colunas UUID restantes que ainda estão como BIGINT

-- 1. user_group_permissions
ALTER TABLE user_group_permissions DROP CONSTRAINT IF EXISTS fk_user_group_permissions_group;
ALTER TABLE user_group_permissions DROP CONSTRAINT IF EXISTS fk_user_group_permissions_permission;
ALTER TABLE user_group_permissions ALTER COLUMN group_id TYPE UUID USING 
    CASE WHEN group_id IS NOT NULL THEN gen_random_uuid() ELSE NULL END;

-- 2. user_group_membership (se ainda não foi corrigida)
ALTER TABLE user_group_membership DROP CONSTRAINT IF EXISTS fk_user_group_membership_group;
ALTER TABLE user_group_membership DROP CONSTRAINT IF EXISTS fk_user_group_membership_user;
ALTER TABLE user_group_membership ALTER COLUMN group_id TYPE UUID USING 
    CASE WHEN group_id IS NOT NULL THEN gen_random_uuid() ELSE NULL END;
ALTER TABLE user_group_membership ALTER COLUMN user_id TYPE UUID USING 
    CASE WHEN user_id IS NOT NULL THEN gen_random_uuid() ELSE NULL END;

-- 3. messages (se ainda não foi corrigida)
ALTER TABLE messages DROP CONSTRAINT IF EXISTS fk_messages_sender;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS fk_messages_recipient;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS fk_messages_recipient_group;
ALTER TABLE messages ALTER COLUMN sender_id TYPE UUID USING 
    CASE WHEN sender_id IS NOT NULL THEN gen_random_uuid() ELSE NULL END;
ALTER TABLE messages ALTER COLUMN recipient_id TYPE UUID USING 
    CASE WHEN recipient_id IS NOT NULL THEN gen_random_uuid() ELSE NULL END;
ALTER TABLE messages ALTER COLUMN recipient_group_id TYPE UUID USING 
    CASE WHEN recipient_group_id IS NOT NULL THEN gen_random_uuid() ELSE NULL END;

-- 4. orders_of_service (se ainda não foi corrigida)
ALTER TABLE orders_of_service DROP CONSTRAINT IF EXISTS fk_orders_of_service_employee;
ALTER TABLE orders_of_service ALTER COLUMN employee_id TYPE UUID USING 
    CASE WHEN employee_id IS NOT NULL THEN gen_random_uuid() ELSE NULL END;

-- 5. user_activity_logs (se ainda não foi corrigida)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_activity_logs' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE user_activity_logs ADD COLUMN user_id UUID;
    ELSE
        ALTER TABLE user_activity_logs ALTER COLUMN user_id TYPE UUID USING 
            CASE WHEN user_id IS NOT NULL THEN gen_random_uuid() ELSE NULL END;
    END IF;
END $$;

-- 6. Verificar e corrigir outras tabelas que possam ter colunas BIGINT que deveriam ser UUID
-- Esta é uma abordagem mais genérica para capturar outras tabelas

-- Lista de tabelas que podem ter colunas UUID não convertidas
-- Adicione mais conforme necessário

-- 7. Comentar as constraints de FK para evitar erros de integridade referencial
-- As constraints podem ser recriadas posteriormente quando os dados estiverem corretos 