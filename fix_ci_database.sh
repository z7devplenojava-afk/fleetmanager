#!/bin/bash
# Script para corrigir o banco de dados CI no VPS

echo "🔧 Corrigindo banco de dados CI no VPS..."

# Conectar no container do PostgreSQL e executar o SQL
docker exec -i fluxbus-db-ci psql -U fluxbus_ci -d fluxbus_ci << 'EOF'
-- Criar a tabela user_custom_permissions
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

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_user_custom_permissions_user_id ON user_custom_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_permissions_permission_key ON user_custom_permissions(permission_key);
CREATE INDEX IF NOT EXISTS idx_user_custom_permissions_enabled ON user_custom_permissions(enabled);

-- Verificar se foi criada
\dt user_custom_permissions
\d user_custom_permissions

EOF

echo "✅ Tabela criada com sucesso!"
echo ""
echo "🔄 Reiniciando backend CI..."
docker-compose -f docker-compose.ci.yml restart backend

echo ""
echo "🏥 Aguardando 10 segundos para o backend iniciar..."
sleep 10

echo ""
echo "🧪 Testando health check..."
curl -s http://localhost:8082/api/health | jq .

echo ""
echo "✅ Processo concluído!"

