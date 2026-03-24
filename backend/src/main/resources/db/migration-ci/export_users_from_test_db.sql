-- =====================================================
-- SCRIPT PARA EXPORTAR USUÁRIOS DO BANCO secured_guard_test
-- Execute este script no PostgreSQL conectado ao banco secured_guard_test
-- e copie os INSERTs gerados para o arquivo V999__seed_ci_essential_data.sql
-- =====================================================

-- 1. EXPORTAR USUÁRIOS (exceto admin@ci que já existe na migration)
SELECT 
    'INSERT INTO users (' ||
    'id, username, password, email, name, status, active, ' ||
    'two_factor_enabled, two_factor_whatsapp, require_password_change, ' ||
    'last_password_change, first_access_completed, whatsapp, ' ||
    'whatsapp_consent, whatsapp_consent_date, whatsapp_consent_ip, whatsapp_consent_user_agent, ' ||
    'created_at, updated_at' ||
    ') VALUES (' ||
    '''' || id || ''', ' ||
    '''' || REPLACE(username, '''', '''''') || ''', ' ||
    '''' || REPLACE(password, '''', '''''') || ''', ' ||
    '''' || REPLACE(email, '''', '''''') || ''', ' ||
    '''' || REPLACE(name, '''', '''''') || ''', ' ||
    '''' || status || ''', ' ||
    COALESCE(active::text, 'true') || ', ' ||
    COALESCE(two_factor_enabled::text, 'false') || ', ' ||
    COALESCE('''' || REPLACE(two_factor_whatsapp, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE(require_password_change::text, 'false') || ', ' ||
    COALESCE('''' || last_password_change::text || '''', 'NULL') || ', ' ||
    COALESCE(first_access_completed::text, 'false') || ', ' ||
    COALESCE('''' || REPLACE(whatsapp, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE(whatsapp_consent::text, 'false') || ', ' ||
    COALESCE('''' || whatsapp_consent_date::text || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(whatsapp_consent_ip, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(whatsapp_consent_user_agent, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || created_at::text || '''', 'NOW()') || ', ' ||
    COALESCE('''' || updated_at::text || '''', 'NOW()') ||
    ') ON CONFLICT (id) DO NOTHING;' as insert_statement
FROM users
WHERE username != 'admin@ci'  -- Excluir admin@ci que já está na migration
ORDER BY username;

-- 2. EXPORTAR USER_ROLES (relacionamentos de usuários com roles)
SELECT 
    'INSERT INTO user_roles (user_id, role_id, created_at) ' ||
    'SELECT ' ||
    '''' || ur.user_id || ''', ' ||
    'r.id, ' ||
    'NOW() ' ||
    'FROM roles r ' ||
    'WHERE r.name = ''' || r.name || ''' ' ||
    'AND NOT EXISTS (' ||
    '    SELECT 1 FROM user_roles ur2 ' ||
    '    WHERE ur2.user_id = ''' || ur.user_id || ''' ' ||
    '    AND ur2.role_id = r.id' ||
    ');' as insert_statement
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN users u ON ur.user_id = u.id
WHERE u.username != 'admin@ci'  -- Excluir admin@ci
ORDER BY u.username, r.name;

