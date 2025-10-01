-- Inserir dados de teste para o sistema de arquivos
-- Primeiro, vamos criar algumas pastas e arquivos para o usuário superadmin

-- Inserir pasta raiz "Documentos"
INSERT INTO file_system_items (
    id, 
    name, 
    path, 
    type, 
    parent_id, 
    owner_id, 
    is_deleted, 
    created_at, 
    modified_at, 
    physical_path
) VALUES (
    gen_random_uuid(),
    'Documentos',
    '/',
    'FOLDER',
    NULL,
    (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1),
    FALSE,
    NOW(),
    NOW(),
    'data/files/' || (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1) || '/Documentos'
);

-- Inserir pasta "Imagens" dentro de Documentos
INSERT INTO file_system_items (
    id, 
    name, 
    path, 
    type, 
    parent_id, 
    owner_id, 
    is_deleted, 
    created_at, 
    modified_at, 
    physical_path
) VALUES (
    gen_random_uuid(),
    'Imagens',
    '/Documentos',
    'FOLDER',
    (SELECT id FROM file_system_items WHERE name = 'Documentos' AND owner_id = (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1) LIMIT 1),
    (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1),
    FALSE,
    NOW(),
    NOW(),
    'data/files/' || (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1) || '/Documentos/Imagens'
);

-- Inserir pasta "Relatórios" dentro de Documentos
INSERT INTO file_system_items (
    id, 
    name, 
    path, 
    type, 
    parent_id, 
    owner_id, 
    is_deleted, 
    created_at, 
    modified_at, 
    physical_path
) VALUES (
    gen_random_uuid(),
    'Relatórios',
    '/Documentos',
    'FOLDER',
    (SELECT id FROM file_system_items WHERE name = 'Documentos' AND owner_id = (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1) LIMIT 1),
    (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1),
    FALSE,
    NOW(),
    NOW(),
    'data/files/' || (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1) || '/Documentos/Relatórios'
);

-- Inserir arquivo "README.txt" na raiz
INSERT INTO file_system_items (
    id, 
    name, 
    path, 
    type, 
    size,
    mime_type,
    file_extension,
    parent_id, 
    owner_id, 
    is_deleted, 
    created_at, 
    modified_at, 
    physical_path
) VALUES (
    gen_random_uuid(),
    'README.txt',
    '/',
    'FILE',
    1024,
    'text/plain',
    'txt',
    NULL,
    (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1),
    FALSE,
    NOW(),
    NOW(),
    'data/files/' || (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1) || '/README.txt'
);

-- Inserir arquivo "relatorio_mensal.pdf" em Relatórios
INSERT INTO file_system_items (
    id, 
    name, 
    path, 
    type, 
    size,
    mime_type,
    file_extension,
    parent_id, 
    owner_id, 
    is_deleted, 
    created_at, 
    modified_at, 
    physical_path
) VALUES (
    gen_random_uuid(),
    'relatorio_mensal.pdf',
    '/Documentos/Relatórios',
    'FILE',
    2048576,
    'application/pdf',
    'pdf',
    (SELECT id FROM file_system_items WHERE name = 'Relatórios' AND owner_id = (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1) LIMIT 1),
    (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1),
    FALSE,
    NOW(),
    NOW(),
    'data/files/' || (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1) || '/Documentos/Relatórios/relatorio_mensal.pdf'
);

-- Inserir arquivo "logo.png" em Imagens
INSERT INTO file_system_items (
    id, 
    name, 
    path, 
    type, 
    size,
    mime_type,
    file_extension,
    parent_id, 
    owner_id, 
    is_deleted, 
    created_at, 
    modified_at, 
    physical_path
) VALUES (
    gen_random_uuid(),
    'logo.png',
    '/Documentos/Imagens',
    'FILE',
    512000,
    'image/png',
    'png',
    (SELECT id FROM file_system_items WHERE name = 'Imagens' AND owner_id = (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1) LIMIT 1),
    (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1),
    FALSE,
    NOW(),
    NOW(),
    'data/files/' || (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1) || '/Documentos/Imagens/logo.png'
);

-- Inserir arquivo "config.json" na raiz
INSERT INTO file_system_items (
    id, 
    name, 
    path, 
    type, 
    size,
    mime_type,
    file_extension,
    parent_id, 
    owner_id, 
    is_deleted, 
    created_at, 
    modified_at, 
    physical_path
) VALUES (
    gen_random_uuid(),
    'config.json',
    '/',
    'FILE',
    2048,
    'application/json',
    'json',
    NULL,
    (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1),
    FALSE,
    NOW(),
    NOW(),
    'data/files/' || (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1) || '/config.json'
);

-- Inserir pasta "Backup" na raiz
INSERT INTO file_system_items (
    id, 
    name, 
    path, 
    type, 
    parent_id, 
    owner_id, 
    is_deleted, 
    created_at, 
    modified_at, 
    physical_path
) VALUES (
    gen_random_uuid(),
    'Backup',
    '/',
    'FOLDER',
    NULL,
    (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1),
    FALSE,
    NOW(),
    NOW(),
    'data/files/' || (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1) || '/Backup'
);

-- Verificar os dados inseridos
SELECT 
    fsi.name,
    fsi.path,
    fsi.type,
    fsi.size,
    fsi.mime_type,
    fsi.file_extension,
    fsi.display_size,
    u.username as owner
FROM file_system_items fsi
JOIN users u ON fsi.owner_id = u.id
WHERE fsi.is_deleted = FALSE
ORDER BY fsi.type, fsi.path, fsi.name;
