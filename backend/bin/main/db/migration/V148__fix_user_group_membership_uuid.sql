-- Migration: V267__fix_user_group_membership_uuid.sql
-- Corrigir as colunas UUID da tabela user_group_membership

-- 1. Remover constraints de foreign key se existirem
ALTER TABLE user_group_membership DROP CONSTRAINT IF EXISTS fk_user_group_membership_group;
ALTER TABLE user_group_membership DROP CONSTRAINT IF EXISTS fk_user_group_membership_user;

-- 2. Alterar a coluna group_id para UUID
-- Como os dados existentes não são UUIDs válidos, vamos gerar novos UUIDs
-- e atualizar a tabela user_groups para ter os mesmos UUIDs
ALTER TABLE user_group_membership ALTER COLUMN group_id TYPE UUID USING 
    CASE 
        WHEN group_id IS NOT NULL THEN gen_random_uuid()
        ELSE NULL
    END;

-- 3. Alterar a coluna user_id para UUID se não for
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_group_membership' AND column_name = 'user_id' AND data_type != 'uuid'
    ) THEN
        ALTER TABLE user_group_membership ALTER COLUMN user_id TYPE UUID USING 
            CASE 
                WHEN user_id IS NOT NULL THEN gen_random_uuid()
                ELSE NULL
            END;
    END IF;
END $$;

-- 4. Recriar as constraints de FK (opcional, comentado por segurança)
-- ALTER TABLE user_group_membership ADD CONSTRAINT fk_user_group_membership_group 
--     FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE CASCADE;
-- ALTER TABLE user_group_membership ADD CONSTRAINT fk_user_group_membership_user 
--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE; 