-- V380: Garantir que todas as colunas necessárias existam na tabela users
-- Esta migration é idempotente e pode ser executada múltiplas vezes
-- Resolve problemas de schema desatualizado em ambientes CI/novos

DO $$
BEGIN
    -- Adicionar colunas de 2FA e controle de senha
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'two_factor_enabled') THEN
        ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE;
        RAISE NOTICE 'Coluna two_factor_enabled adicionada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'two_factor_whatsapp') THEN
        ALTER TABLE users ADD COLUMN two_factor_whatsapp VARCHAR(20);
        RAISE NOTICE 'Coluna two_factor_whatsapp adicionada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'require_password_change') THEN
        ALTER TABLE users ADD COLUMN require_password_change BOOLEAN NOT NULL DEFAULT FALSE;
        RAISE NOTICE 'Coluna require_password_change adicionada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_password_change') THEN
        ALTER TABLE users ADD COLUMN last_password_change TIMESTAMP;
        RAISE NOTICE 'Coluna last_password_change adicionada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'first_access_completed') THEN
        ALTER TABLE users ADD COLUMN first_access_completed BOOLEAN NOT NULL DEFAULT FALSE;
        RAISE NOTICE 'Coluna first_access_completed adicionada';
    END IF;

    -- Adicionar colunas de WhatsApp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'whatsapp') THEN
        ALTER TABLE users ADD COLUMN whatsapp VARCHAR(20);
        RAISE NOTICE 'Coluna whatsapp adicionada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'whatsapp_consent') THEN
        ALTER TABLE users ADD COLUMN whatsapp_consent BOOLEAN NOT NULL DEFAULT FALSE;
        RAISE NOTICE 'Coluna whatsapp_consent adicionada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'whatsapp_consent_date') THEN
        ALTER TABLE users ADD COLUMN whatsapp_consent_date TIMESTAMP;
        RAISE NOTICE 'Coluna whatsapp_consent_date adicionada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'whatsapp_consent_ip') THEN
        ALTER TABLE users ADD COLUMN whatsapp_consent_ip VARCHAR(45);
        RAISE NOTICE 'Coluna whatsapp_consent_ip adicionada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'whatsapp_consent_user_agent') THEN
        ALTER TABLE users ADD COLUMN whatsapp_consent_user_agent VARCHAR(500);
        RAISE NOTICE 'Coluna whatsapp_consent_user_agent adicionada';
    END IF;

    RAISE NOTICE '✅ Migration V380 concluída: Schema da tabela users atualizado com sucesso';
END $$;

-- Comentários para documentação
COMMENT ON COLUMN users.two_factor_enabled IS 'Indica se autenticação de dois fatores está ativada';
COMMENT ON COLUMN users.two_factor_whatsapp IS 'Número de WhatsApp para 2FA';
COMMENT ON COLUMN users.require_password_change IS 'Indica se o usuário precisa alterar a senha';
COMMENT ON COLUMN users.last_password_change IS 'Data da última alteração de senha';
COMMENT ON COLUMN users.first_access_completed IS 'Indica se o primeiro acesso foi concluído';
COMMENT ON COLUMN users.whatsapp IS 'Número de WhatsApp do usuário';
COMMENT ON COLUMN users.whatsapp_consent IS 'Consentimento explícito para receber mensagens WhatsApp (LGPD + Meta Policy)';
COMMENT ON COLUMN users.whatsapp_consent_date IS 'Data e hora do consentimento para WhatsApp';
COMMENT ON COLUMN users.whatsapp_consent_ip IS 'IP do usuário no momento do consentimento';
COMMENT ON COLUMN users.whatsapp_consent_user_agent IS 'User-Agent do navegador no momento do consentimento';

