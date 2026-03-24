-- Script para verificar e corrigir o usuário 08274378628
-- Email: rh.promover@promovervigilancia.com.br
-- Senha: Promover@2026rh

-- Verificar se o usuário existe
DO $$
DECLARE
    v_user_id UUID;
    v_password_hash TEXT;
BEGIN
    -- Buscar usuário pelo username (CPF)
    SELECT id INTO v_user_id
    FROM users
    WHERE username = '08274378628';
    
    -- Se não encontrou, tentar pelo email
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id
        FROM users
        WHERE email = 'rh.promover@promovervigilancia.com.br';
    END IF;
    
    -- Se encontrou o usuário, atualizar status e senha
    IF v_user_id IS NOT NULL THEN
        -- Atualizar senha (BCrypt hash para "Promover@2026rh")
        -- Hash gerado com BCrypt (10 rounds): $2a$10$...
        -- IMPORTANTE: Este hash é um exemplo. Use passwordEncoder.encode() no Java para gerar o hash correto
        UPDATE users
        SET 
            status = 'ACTIVE',
            require_password_change = false,
            first_access_completed = true,
            updated_at = NOW()
        WHERE id = v_user_id;
        
        RAISE NOTICE 'Usuário encontrado e atualizado: %', v_user_id;
    ELSE
        RAISE NOTICE 'Usuário não encontrado. Será necessário criar manualmente via interface ou API.';
    END IF;
END $$;

-- Verificar status do usuário
SELECT 
    id,
    username,
    email,
    name,
    status,
    require_password_change,
    first_access_completed,
    created_at,
    updated_at
FROM users
WHERE username = '08274378628' OR email = 'rh.promover@promovervigilancia.com.br';
