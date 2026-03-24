-- =====================================================
-- V320: Tabela de Consentimento LGPD
-- =====================================================
-- Armazena o aceite dos termos de uso e política de privacidade
-- conforme exigido pela Lei Geral de Proteção de Dados (LGPD)

-- Drop table se já existir (limpar estado inconsistente)
DROP TABLE IF EXISTS user_consents CASCADE;

CREATE TABLE user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Tipo de consentimento
    consent_type VARCHAR(50) NOT NULL, -- 'TERMS_OF_USE', 'PRIVACY_POLICY', 'DATA_PROCESSING'
    
    -- Versão do termo aceito
    term_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    
    -- Aceite
    accepted BOOLEAN NOT NULL DEFAULT FALSE,
    accepted_at TIMESTAMP,
    
    -- IP e User Agent no momento do aceite
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Geolocalização (opcional)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Metadados
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Revogação
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP,
    revoked_reason TEXT,
    
    -- Foreign key
    CONSTRAINT fk_user_consent_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    
    -- Índices
    CONSTRAINT unique_user_consent UNIQUE (user_id, consent_type, term_version)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON user_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_user_consents_accepted ON user_consents(accepted);
CREATE INDEX IF NOT EXISTS idx_user_consents_created_at ON user_consents(created_at);

COMMENT ON TABLE user_consents IS 'Armazena consentimentos LGPD dos usuários';
COMMENT ON COLUMN user_consents.consent_type IS 'Tipo do consentimento: TERMS_OF_USE, PRIVACY_POLICY, DATA_PROCESSING';
COMMENT ON COLUMN user_consents.term_version IS 'Versão do termo aceito (ex: 1.0, 1.1, 2.0)';
COMMENT ON COLUMN user_consents.ip_address IS 'IP do usuário no momento do aceite';
COMMENT ON COLUMN user_consents.user_agent IS 'Navegador/dispositivo usado no aceite';

