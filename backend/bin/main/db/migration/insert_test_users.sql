-- Script para inserir usuários de teste
-- Execute este script diretamente no PostgreSQL

-- Senha: Password123! (hash BCrypt)
INSERT INTO users (id, username, password, email, name, role, status, active, created_at, updated_at)
VALUES 
    ('00000000-0000-0000-0000-000000000010', 'testuser', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'test@example.com', 'Usuário Teste', 'ADMIN', 'ACTIVE', true, NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000011', 'rhuser', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'rh@example.com', 'Usuário RH', 'RH', 'ACTIVE', true, NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000012', 'colaborador', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'colaborador@example.com', 'Colaborador Teste', 'VIGILANTE', 'ACTIVE', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING; 