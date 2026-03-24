-- V330: Adicionar campos de consentimento para envio de WhatsApp
-- Conforme política da Meta/WhatsApp Business - Opt-in obrigatório

-- Adicionar colunas à tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_consent BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_consent_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_consent_ip VARCHAR(45);
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_consent_user_agent VARCHAR(500);

-- Comentários para documentação
COMMENT ON COLUMN users.whatsapp_consent IS 'Consentimento explícito para receber mensagens WhatsApp (LGPD + Meta Policy)';
COMMENT ON COLUMN users.whatsapp_consent_date IS 'Data e hora do consentimento para WhatsApp';
COMMENT ON COLUMN users.whatsapp_consent_ip IS 'IP do usuário no momento do consentimento';
COMMENT ON COLUMN users.whatsapp_consent_user_agent IS 'User-Agent do navegador no momento do consentimento';

-- Criar índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_users_whatsapp_consent ON users(whatsapp_consent);

