-- Script para criar usuário de teste
-- Senha: admin123 (hash BCrypt)

INSERT INTO users (id, username, password, email, name, role, status, active)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'admin',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- senha: password
    'admin@test.com',
    'Administrador Teste',
    'ADMIN',
    'ACTIVE',
    true
);

-- Usuário alternativo com senha mais simples
INSERT INTO users (id, username, password, email, name, role, status, active)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'test',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9P8jskKDsh.jbwO', -- senha: test123
    'test@test.com',
    'Usuário Teste',
    'ADMIN',
    'ACTIVE',
    true
);