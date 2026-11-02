-- ===========================================================================
-- V4652: Garante estado correto do SUPER_ADMIN jose.ramos em todos os ambientes
-- Problema: usuario tinha role ADMIN duplicada + nao estava no GRUPO_SUPER_ADMIN
-- Solucao:
--   1. Remove roles duplicadas mantendo apenas SUPER_ADMIN
--   2. Garante associacao ao grupo GRUPO_SUPER_ADMIN
-- ===========================================================================

DO $$
DECLARE
    v_user_id    UUID;
    v_sa_role_id UUID;
    v_sa_group_id UUID;
BEGIN
    -- Localizar usuario jose.ramos
    SELECT id INTO v_user_id FROM users WHERE username = 'jose.ramos' LIMIT 1;
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'Usuário jose.ramos nao encontrado, pulando migration.';
        RETURN;
    END IF;

    -- Localizar a role SUPER_ADMIN
    SELECT id INTO v_sa_role_id FROM roles WHERE name = 'SUPER_ADMIN' LIMIT 1;
    IF v_sa_role_id IS NULL THEN
        RAISE NOTICE 'Role SUPER_ADMIN nao encontrada, pulando migration.';
        RETURN;
    END IF;

    -- Garantir que a role SUPER_ADMIN existe na tabela user_roles
    INSERT INTO user_roles (user_id, role_id, created_at)
    VALUES (v_user_id, v_sa_role_id, NOW())
    ON CONFLICT (user_id, role_id) DO NOTHING;

    -- Remover todas as outras roles (ADMIN, COLABORADOR, etc.) que nao sejam SUPER_ADMIN
    DELETE FROM user_roles
    WHERE user_id = v_user_id
      AND role_id <> v_sa_role_id;

    RAISE NOTICE 'Roles de jose.ramos corrigidas: apenas SUPER_ADMIN mantida.';

    -- Localizar o grupo GRUPO_SUPER_ADMIN
    SELECT id INTO v_sa_group_id FROM user_groups WHERE group_name = 'GRUPO_SUPER_ADMIN' LIMIT 1;
    IF v_sa_group_id IS NULL THEN
        RAISE NOTICE 'Grupo GRUPO_SUPER_ADMIN nao encontrado, pulando associacao de grupo.';
        RETURN;
    END IF;

    -- Garantir associacao ao GRUPO_SUPER_ADMIN
    INSERT INTO user_group_membership (user_id, group_id, created_at)
    VALUES (v_user_id, v_sa_group_id, NOW())
    ON CONFLICT (user_id, group_id) DO NOTHING;

    RAISE NOTICE 'jose.ramos associado ao GRUPO_SUPER_ADMIN com sucesso.';

    -- Garantir usuario ativo
    UPDATE users
    SET active = true,
        status = 'ACTIVE',
        blocked = false,
        first_access_completed = true,
        require_password_change = false
    WHERE id = v_user_id;

    RAISE NOTICE 'Estado do usuario jose.ramos verificado e corrigido.';
END $$;
