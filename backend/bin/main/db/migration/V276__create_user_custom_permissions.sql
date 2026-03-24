-- Tabela de permissões customizadas por usuário
-- Permite que SUPER_ADMIN habilite funcionalidades específicas para COLABORADOR

CREATE TABLE IF NOT EXISTS user_custom_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    permission_key VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    granted_by UUID,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user_custom_permissions_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_custom_permissions_granted_by 
        FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_user_permission 
        UNIQUE (user_id, permission_key)
);

-- Índices para performance
CREATE INDEX idx_user_custom_permissions_user_id ON user_custom_permissions(user_id);
CREATE INDEX idx_user_custom_permissions_permission_key ON user_custom_permissions(permission_key);
CREATE INDEX idx_user_custom_permissions_enabled ON user_custom_permissions(enabled);

-- Comentários
COMMENT ON TABLE user_custom_permissions IS 'Permissões customizadas por usuário, habilitadas pelo SUPER_ADMIN';
COMMENT ON COLUMN user_custom_permissions.permission_key IS 'Chave da permissão (ex: FINANCIAL_READ, OPERATIONAL_READ, etc.)';
COMMENT ON COLUMN user_custom_permissions.enabled IS 'Se a permissão está ativa';
COMMENT ON COLUMN user_custom_permissions.granted_by IS 'ID do SUPER_ADMIN que concedeu a permissão';
COMMENT ON COLUMN user_custom_permissions.granted_at IS 'Data e hora em que a permissão foi concedida';
COMMENT ON COLUMN user_custom_permissions.revoked_at IS 'Data e hora em que a permissão foi revogada';

