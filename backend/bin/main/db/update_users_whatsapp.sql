-- ========================================
-- SCRIPT PARA ATUALIZAR WHATSAPP NA TABELA USERS
-- ========================================
-- Este script atualiza o campo whatsapp na tabela users
-- baseado nos dados do JSON de funcionários

-- Primeiro, vamos criar uma tabela temporária com os dados do JSON
CREATE TEMP TABLE temp_funcionarios (
    nome VARCHAR(255),
    cpf VARCHAR(14),
    telefone VARCHAR(20),
    email VARCHAR(255),
    possui_whatsapp BOOLEAN
);

-- Inserir dados do JSON (será preenchido pelo script PowerShell)
-- INSERT INTO temp_funcionarios (nome, cpf, telefone, email, possui_whatsapp) VALUES
-- ('João Silva', '12345678900', '5511999999999', 'joao@email.com', true),
-- ('Maria Santos', '98765432100', '5511888888888', 'maria@email.com', true);

-- Verificar dados antes da atualização
SELECT 
    u.id,
    u.username as cpf_atual,
    u.whatsapp as whatsapp_atual,
    t.nome,
    t.cpf as cpf_json,
    t.telefone as telefone_json
FROM users u
LEFT JOIN temp_funcionarios t ON u.username = t.cpf
WHERE t.cpf IS NOT NULL
ORDER BY u.id;

-- Atualizar o campo whatsapp apenas onde há correspondência de CPF
UPDATE users 
SET whatsapp = temp_funcionarios.telefone
FROM temp_funcionarios 
WHERE users.username = temp_funcionarios.cpf
AND temp_funcionarios.telefone IS NOT NULL
AND temp_funcionarios.telefone != '';

-- Verificar dados após a atualização
SELECT 
    u.id,
    u.username as cpf,
    u.whatsapp as whatsapp_atualizado,
    t.nome,
    t.telefone as telefone_json
FROM users u
LEFT JOIN temp_funcionarios t ON u.username = t.cpf
WHERE t.cpf IS NOT NULL
ORDER BY u.id;

-- Mostrar estatísticas
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN whatsapp IS NOT NULL AND whatsapp != '' THEN 1 END) as com_whatsapp,
    COUNT(CASE WHEN whatsapp IS NULL OR whatsapp = '' THEN 1 END) as sem_whatsapp
FROM users;

-- Limpar tabela temporária
DROP TABLE temp_funcionarios; 