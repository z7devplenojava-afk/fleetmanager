-- Adiciona campos para controle de primeiro acesso e autenticação de dois fatores

-- Adicionar colunas à tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_access BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP;

-- Criar tabela para códigos 2FA temporários
CREATE TABLE IF NOT EXISTS two_factor_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    code VARCHAR(6) NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_two_factor_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_two_factor_codes_user_id ON two_factor_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_codes_code ON two_factor_codes(code);
CREATE INDEX IF NOT EXISTS idx_two_factor_codes_expiry_date ON two_factor_codes(expiry_date);
CREATE INDEX IF NOT EXISTS idx_two_factor_codes_purpose ON two_factor_codes(purpose);

-- Comentários
COMMENT ON COLUMN users.first_access IS 'Indica se é o primeiro acesso do usuário (obriga mudança de senha)';
COMMENT ON COLUMN users.two_factor_enabled IS 'Indica se autenticação de dois fatores está ativada';
COMMENT ON COLUMN users.last_password_change IS 'Data da última alteração de senha';
COMMENT ON TABLE two_factor_codes IS 'Códigos temporários para autenticação de dois fatores';
COMMENT ON COLUMN two_factor_codes.purpose IS 'Propósito do código: LOGIN, ACTIVATION, PASSWORD_RESET';

