-- Script para executar a migration V276 manualmente no ambiente local
-- Execute no DBeaver conectado no banco de desenvolvimento local

-- 1. Verificar se a tabela já existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_custom_permissions'
);

-- 2. Criar a tabela se não existir
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

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS idx_user_custom_permissions_user_id ON user_custom_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_permissions_permission_key ON user_custom_permissions(permission_key);
CREATE INDEX IF NOT EXISTS idx_user_custom_permissions_enabled ON user_custom_permissions(enabled);

-- 4. Adicionar comentários
COMMENT ON TABLE user_custom_permissions IS 'Permissões customizadas por usuário, habilitadas pelo SUPER_ADMIN';
COMMENT ON COLUMN user_custom_permissions.permission_key IS 'Chave da permissão (ex: FINANCIAL_READ, OPERATIONAL_READ, etc.)';
COMMENT ON COLUMN user_custom_permissions.enabled IS 'Se a permissão está ativa';
COMMENT ON COLUMN user_custom_permissions.granted_by IS 'ID do SUPER_ADMIN que concedeu a permissão';
COMMENT ON COLUMN user_custom_permissions.granted_at IS 'Data e hora em que a permissão foi concedida';
COMMENT ON COLUMN user_custom_permissions.revoked_at IS 'Data e hora em que a permissão foi revogada';

-- 5. Registrar a migration no Flyway (se necessário)
-- Verifique primeiro se a migration já está registrada
SELECT * FROM flyway_schema_history WHERE version = '276';

-- Se não estiver registrada, adicione manualmente:
-- INSERT INTO flyway_schema_history (
--     installed_rank, version, description, type, script, 
--     checksum, installed_by, installed_on, execution_time, success
-- ) VALUES (
--     (SELECT COALESCE(MAX(installed_rank), 0) + 1 FROM flyway_schema_history),
--     '276',
--     'create user custom permissions',
--     'SQL',
--     'V276__create_user_custom_permissions.sql',
--     NULL,
--     CURRENT_USER,
--     CURRENT_TIMESTAMP,
--     0,
--     true
-- );

-- 6. Verificar se foi criada com sucesso
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'user_custom_permissions' 
ORDER BY ordinal_position;

