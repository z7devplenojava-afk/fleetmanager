-- Migration V455: Seed employee record for jose.ramos
-- Links employee profile to the user created in V425

ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS endereco_rua VARCHAR(255),
    ADD COLUMN IF NOT EXISTS endereco_numero VARCHAR(20),
    ADD COLUMN IF NOT EXISTS endereco_complemento VARCHAR(100),
    ADD COLUMN IF NOT EXISTS endereco_bairro VARCHAR(100),
    ADD COLUMN IF NOT EXISTS endereco_cidade VARCHAR(100),
    ADD COLUMN IF NOT EXISTS endereco_estado VARCHAR(2),
    ADD COLUMN IF NOT EXISTS endereco_cep VARCHAR(10);

INSERT INTO employees (
    id, user_id, name, document, email, phone, status,
    birth_date, hire_date, address,
    endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep,
    created_at, updated_at
)
SELECT
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '8b63e5ce-0a98-490d-b11f-82990b3dc5be',
    'José Mário Ramos',
    '123.456.789-00',
    'jose.ramos@dominio.com',
    '(11) 98765-4321',
    'ACTIVE',
    '1985-05-15',
    '2020-03-15',
    'Rua das Flores, 123 - Centro, São Paulo - SP',
    'Rua das Flores',
    '123',
    'Centro',
    'São Paulo',
    'SP',
    '01234-567',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM employees WHERE document = '123.456.789-00' OR id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
);
