-- Criar tabela de consentimento de termos LGPD
CREATE TABLE IF NOT EXISTS user_terms_consent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('EMPLOYEE', 'SUPERVISOR', 'ADMIN')),
    user_cpf VARCHAR(14) NOT NULL,
    accepted BOOLEAN NOT NULL,
    accepted_at TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    terms_version VARCHAR(64),
    privacy_policy_version VARCHAR(64),
    terms_content_hash VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_terms_consent_user_id ON user_terms_consent(user_id);
CREATE INDEX IF NOT EXISTS idx_user_terms_consent_user_type ON user_terms_consent(user_type);
CREATE INDEX IF NOT EXISTS idx_user_terms_consent_user_cpf ON user_terms_consent(user_cpf);
CREATE INDEX IF NOT EXISTS idx_user_terms_consent_accepted ON user_terms_consent(accepted);
CREATE INDEX IF NOT EXISTS idx_user_terms_consent_accepted_at ON user_terms_consent(accepted_at);
CREATE INDEX IF NOT EXISTS idx_user_terms_consent_created_at ON user_terms_consent(created_at);

-- Criar índice composto para busca eficiente
CREATE INDEX IF NOT EXISTS idx_user_terms_consent_user_type_accepted ON user_terms_consent(user_type, accepted);
CREATE INDEX IF NOT EXISTS idx_user_terms_consent_user_cpf_type ON user_terms_consent(user_cpf, user_type);
