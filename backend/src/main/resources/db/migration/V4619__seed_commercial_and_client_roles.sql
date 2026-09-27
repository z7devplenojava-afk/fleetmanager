-- Migration V4619: Insere roles para Comercial, CRM, Vendas, Portaria e Clientes
INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'COMERCIAL', 'Comercial e CRM') ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'GESTOR_COMERCIAL', 'Gestor Comercial') ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'VENDAS', 'Vendas e Atendimento') ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'PORTARIA', 'Portaria e Acesso') ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'CLIENTE', 'Cliente / Portal do Cliente') ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'CLIENT_USER', 'Usuário Cliente') ON CONFLICT (name) DO NOTHING;
