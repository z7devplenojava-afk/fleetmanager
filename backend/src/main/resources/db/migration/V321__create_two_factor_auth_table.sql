-- =====================================================
-- V321: Tabela de Autenticação de Dois Fatores (2FA)
-- =====================================================
-- Armazena códigos de verificação enviados via WhatsApp

-- Drop table se já existir (limpar estado inconsistente)
DROP TABLE IF EXISTS two_factor_codes CASCADE;

CREATE TABLE two_factor_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Código de verificação (6 dígitos)
    code VARCHAR(6) NOT NULL,
    
    -- Canal de envio
    delivery_channel VARCHAR(20) NOT NULL DEFAULT 'WHATSAPP', -- 'WHATSAPP', 'EMAIL', 'SMS'
    
    -- Telefone/Email de destino
    destination VARCHAR(100) NOT NULL,
    
    -- Status do código
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    is_expired BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Tentativas de validação
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL, -- Código expira em 5 minutos
    used_at TIMESTAMP,
    
    -- Metadados de segurança
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Foreign key
    CONSTRAINT fk_2fa_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_2fa_user_id ON two_factor_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_2fa_code ON two_factor_codes(code);
CREATE INDEX IF NOT EXISTS idx_2fa_created_at ON two_factor_codes(created_at);
CREATE INDEX IF NOT EXISTS idx_2fa_expires_at ON two_factor_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_2fa_is_used ON two_factor_codes(is_used);

-- Adicionar campos ao modelo User para habilitar 2FA
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_whatsapp VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS require_password_change BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_access_completed BOOLEAN DEFAULT FALSE;

COMMENT ON TABLE two_factor_codes IS 'Códigos de autenticação de dois fatores (2FA)';
COMMENT ON COLUMN two_factor_codes.code IS 'Código de 6 dígitos enviado ao usuário';
COMMENT ON COLUMN two_factor_codes.delivery_channel IS 'Canal de envio: WHATSAPP, EMAIL ou SMS';
COMMENT ON COLUMN two_factor_codes.expires_at IS 'Código expira em 5 minutos após criação';
COMMENT ON COLUMN users.two_factor_enabled IS 'Indica se usuário habilitou autenticação de dois fatores';
COMMENT ON COLUMN users.require_password_change IS 'Força usuário a trocar senha no próximo login';
COMMENT ON COLUMN users.first_access_completed IS 'Indica se usuário já completou fluxo de primeiro acesso (LGPD + 2FA)';

