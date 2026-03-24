-- =====================================================
-- Script de DEBUG - Erro 500 no Login
-- =====================================================

-- 1. Verificar se usuário existe e tem dados completos
SELECT 
    id,
    username,
    email,
    name,
    active,
    status,
    first_access,
    two_factor_enabled,
    CASE 
        WHEN id IS NULL THEN '❌ SEM ID'
        WHEN username IS NULL THEN '❌ SEM USERNAME'
        WHEN email IS NULL THEN '❌ SEM EMAIL'
        WHEN name IS NULL THEN '❌ SEM NAME'
        ELSE '✅ OK'
    END as validacao
FROM users
WHERE username = '05986003616' OR email LIKE '%05986003616%';

-- 2. Verificar ROLES do usuário
SELECT 
    u.username,
    u.email,
    r.name as role_name,
    r.id as role_id
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.username = '05986003616' OR u.email LIKE '%05986003616%';

-- 3. Verificar se usuário tem pelo menos 1 role
SELECT 
    u.username,
    COUNT(ur.role_id) as total_roles,
    CASE 
        WHEN COUNT(ur.role_id) = 0 THEN '❌ SEM ROLES - ERRO CRÍTICO!'
        ELSE '✅ OK'
    END as status
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.username = '05986003616' OR u.email LIKE '%05986003616%'
GROUP BY u.username;

-- 4. Verificar senha (formato BCrypt)
SELECT 
    username,
    email,
    LEFT(password, 10) as senha_hash_inicio,
    LENGTH(password) as senha_tamanho,
    CASE 
        WHEN password LIKE '$2a$%' OR password LIKE '$2b$%' THEN '✅ BCrypt'
        ELSE '❌ TEXTO PLANO!'
    END as senha_status
FROM users
WHERE username = '05986003616' OR email LIKE '%05986003616%';

-- 5. Verificar se role COLABORADOR existe
SELECT * FROM roles WHERE name = 'COLABORADOR';

-- 6. Criar role COLABORADOR se não existir
INSERT INTO roles (id, name, description, created_at)
VALUES (
    gen_random_uuid(),
    'COLABORADOR',
    'Funcionário colaborador da empresa',
    NOW()
)
ON CONFLICT (name) DO NOTHING;

-- 7. Associar role COLABORADOR ao usuário (se estiver sem role)
DO $$
DECLARE
    user_id_var UUID;
    colaborador_role_id UUID;
BEGIN
    -- Buscar ID do usuário
    SELECT id INTO user_id_var
    FROM users
    WHERE username = '05986003616' OR email LIKE '%05986003616%'
    LIMIT 1;
    
    IF user_id_var IS NULL THEN
        RAISE NOTICE '❌ Usuário não encontrado!';
        RETURN;
    END IF;
    
    -- Buscar ID do role COLABORADOR
    SELECT id INTO colaborador_role_id
    FROM roles
    WHERE name = 'COLABORADOR';
    
    IF colaborador_role_id IS NULL THEN
        RAISE NOTICE '❌ Role COLABORADOR não encontrado!';
        RETURN;
    END IF;
    
    -- Verificar se usuário já tem role
    IF NOT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = user_id_var
    ) THEN
        -- Inserir role COLABORADOR
        INSERT INTO user_roles (user_id, role_id)
        VALUES (user_id_var, colaborador_role_id);
        
        RAISE NOTICE '✅ Role COLABORADOR adicionado ao usuário!';
    ELSE
        RAISE NOTICE '✅ Usuário já possui roles';
    END IF;
END $$;

-- 8. VERIFICAÇÃO FINAL
SELECT 
    u.id,
    u.username,
    u.email,
    u.name,
    u.active,
    u.status,
    u.first_access,
    LEFT(u.password, 10) as senha_hash,
    LENGTH(u.password) as senha_tam,
    STRING_AGG(r.name, ', ') as roles,
    COUNT(r.id) as total_roles,
    CASE 
        WHEN u.id IS NULL THEN '❌ SEM ID'
        WHEN COUNT(r.id) = 0 THEN '❌ SEM ROLES'
        WHEN u.password NOT LIKE '$2a$%' THEN '❌ SENHA NÃO CRIPTOGRAFADA'
        WHEN NOT u.active THEN '❌ USUÁRIO INATIVO'
        ELSE '✅ TUDO OK'
    END as status_final
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.username = '05986003616' OR u.email LIKE '%05986003616%'
GROUP BY u.id, u.username, u.email, u.name, u.active, u.status, u.first_access, u.password;

-- =====================================================
-- RESULTADO ESPERADO:
-- ✅ Usuário encontrado
-- ✅ ID válido (UUID)
-- ✅ Email: colaborador.05986003616@promovervigilancia.com.br
-- ✅ Senha: $2a$10$... (BCrypt)
-- ✅ Active: true
-- ✅ Status: ACTIVE
-- ✅ Roles: COLABORADOR
-- ✅ Total roles: >= 1
-- ✅ Status final: ✅ TUDO OK
-- =====================================================

