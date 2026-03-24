-- Migration para criar tabela de configurações de segurança
-- V263: Create security_settings table

CREATE TABLE IF NOT EXISTS security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    
    -- Configurações de 2FA
    two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
    two_factor_method VARCHAR(20) DEFAULT 'EMAIL',
    
    -- Políticas de senha
    password_expiry_enabled BOOLEAN NOT NULL DEFAULT true,
    password_expiry_days INTEGER NOT NULL DEFAULT 90,
    password_min_length INTEGER NOT NULL DEFAULT 8,
    password_require_uppercase BOOLEAN NOT NULL DEFAULT true,
    password_require_lowercase BOOLEAN NOT NULL DEFAULT true,
    password_require_numbers BOOLEAN NOT NULL DEFAULT true,
    password_require_symbols BOOLEAN NOT NULL DEFAULT false,
    
    -- Bloqueio de conta
    account_lockout_enabled BOOLEAN NOT NULL DEFAULT true,
    max_failed_attempts INTEGER NOT NULL DEFAULT 5,
    lockout_duration_minutes INTEGER NOT NULL DEFAULT 30,
    
    -- Configurações gerais
    session_timeout_minutes INTEGER NOT NULL DEFAULT 60,
    ip_whitelist_enabled BOOLEAN NOT NULL DEFAULT false,
    ip_whitelist TEXT,
    audit_log_enabled BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_security_settings_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT uk_security_settings_company UNIQUE (company_id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_security_settings_company_id ON security_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_security_settings_created_at ON security_settings(created_at);

-- Comentários para documentação
COMMENT ON TABLE security_settings IS 'Configurações de segurança por empresa';
COMMENT ON COLUMN security_settings.two_factor_method IS 'Método de 2FA: EMAIL, SMS, APP';
COMMENT ON COLUMN security_settings.ip_whitelist IS 'Lista de IPs permitidos separados por vírgula';
COMMENT ON COLUMN security_settings.password_expiry_days IS 'Dias para expiração da senha';
COMMENT ON COLUMN security_settings.max_failed_attempts IS 'Máximo de tentativas de login falhas';
COMMENT ON COLUMN security_settings.lockout_duration_minutes IS 'Duração do bloqueio em minutos';
COMMENT ON COLUMN security_settings.session_timeout_minutes IS 'Timeout da sessão em minutos';
