-- Script para criar a tabela user_custom_permissions que está faltando
-- Execute este script no banco de dados para resolver o erro de login

CREATE TABLE IF NOT EXISTS user_custom_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    permission_key VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    granted_by UUID,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user_custom_permissions_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_custom_permissions_granted_by 
        FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_user_custom_permissions_user_key 
        UNIQUE (user_id, permission_key)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_custom_permissions_user_id ON user_custom_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_permissions_enabled ON user_custom_permissions(enabled);
CREATE INDEX IF NOT EXISTS idx_user_custom_permissions_permission_key ON user_custom_permissions(permission_key);

-- Comentários para documentação
COMMENT ON TABLE user_custom_permissions IS 'Tabela para armazenar permissões customizadas concedidas a usuários específicos';
COMMENT ON COLUMN user_custom_permissions.user_id IS 'ID do usuário que recebeu a permissão';
COMMENT ON COLUMN user_custom_permissions.permission_key IS 'Chave da permissão (ex: EMPLOYEES_READ, REPORTS_WRITE)';
COMMENT ON COLUMN user_custom_permissions.enabled IS 'Se a permissão está ativa';
COMMENT ON COLUMN user_custom_permissions.granted_by IS 'ID do usuário que concedeu a permissão';
COMMENT ON COLUMN user_custom_permissions.granted_at IS 'Data/hora em que a permissão foi concedida';
COMMENT ON COLUMN user_custom_permissions.revoked_at IS 'Data/hora em que a permissão foi revogada (NULL se ativa)';
