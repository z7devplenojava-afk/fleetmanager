-- =====================================================
-- V322: Tabela de Recuperação de Senha
-- =====================================================
-- Armazena tokens para recuperação/reset de senha

-- Drop table se já existir (limpar estado inconsistente)
DROP TABLE IF EXISTS password_reset_tokens CASCADE;

CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Token único (UUID)
    token VARCHAR(255) NOT NULL UNIQUE,
    
    -- Status
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    is_expired BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL, -- Token expira em 1 hora
    used_at TIMESTAMP,
    
    -- Metadados
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Email para onde foi enviado
    email VARCHAR(255) NOT NULL,
    
    -- Foreign key
    CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_created_at ON password_reset_tokens(created_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_is_used ON password_reset_tokens(is_used);

COMMENT ON TABLE password_reset_tokens IS 'Tokens para recuperação de senha via email';
COMMENT ON COLUMN password_reset_tokens.token IS 'Token único UUID enviado por email';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Token expira em 1 hora após criação';
COMMENT ON COLUMN password_reset_tokens.email IS 'Email para onde o token foi enviado';

