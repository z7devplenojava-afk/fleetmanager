-- Inserção de usuário administrador
INSERT INTO users (id, username, password, email, name, role, status, active)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin',
    '$2a$10$X7UrH5UxX5UxX5UxX5UxX.5UxX5UxX5UxX5UxX5UxX5UxX5UxX5UxX',
    'admin@example.com',
    'Administrador',
    'ADMIN',
    'ACTIVE',
    true
);

-- Inserção de turnos padrão
INSERT INTO shifts (id, name, start_time, end_time)
VALUES
    ('00000000-0000-0000-0000-000000000002', 'Manhã', '08:00:00', '16:00:00'),
    ('00000000-0000-0000-0000-000000000003', 'Tarde', '16:00:00', '00:00:00'),
    ('00000000-0000-0000-0000-000000000004', 'Noite', '00:00:00', '08:00:00');

-- Inserção de unidade matriz
INSERT INTO units (id, name, description, address, phone, email)
VALUES (
    '00000000-0000-0000-0000-000000000005',
    'Matriz',
    'Unidade matriz da empresa',
    'Rua Principal, 123',
    '(11) 1234-5678',
    'matriz@example.com'
);

-- Inserção de cargo padrão
INSERT INTO positions (id, name, description, unit_id)
VALUES (
    '00000000-0000-0000-0000-000000000006',
    'Vigia',
    'Cargo de vigia',
    '00000000-0000-0000-0000-000000000005'
); 