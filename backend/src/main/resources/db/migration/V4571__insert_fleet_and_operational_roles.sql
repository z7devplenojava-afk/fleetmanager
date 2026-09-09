-- Migration V4571: Insere roles operacionais, de manutenção, frota, financeiro e administrativo na tabela roles

INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'MANUTENCAO', 'Manutenção') ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'MECANICO', 'Mecânico') ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'GESTOR_TRAFEGO', 'Gestor de Tráfego') ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'GESTOR_DE_TRAFEGO', 'Gestor de Tráfego') ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'MOTORISTA', 'Motorista') ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'ALMOXARIFADO', 'Almoxarifado') ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'COMPRAS', 'Compras') ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'GESTOR_DE_MANUTENCAO', 'Gestor de Manutenção') ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'ENCARREGADO_DE_MANUTENCAO', 'Encarregado de Manutenção') ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'GESTOR_DE_COMPRAS', 'Gestor de Compras') ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'GESTOR_FINANCEIRO', 'Gestor Financeiro') ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'GESTOR_OPERACIONAL', 'Gestor Operacional') ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'AUXILIAR_ADMINISTRATIVO', 'Auxiliar Administrativo') ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'AUXILIAR_DE_RH', 'Auxiliar de RH') ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'AUXILIAR_DE_DEPARTAMENTO_PESSOAL', 'Auxiliar de Departamento Pessoal') ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'ASSISTENTE_OPERACIONAL', 'Assistente Operacional') ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'ASSISTENTE_LIMPEZA', 'Assistente de Limpeza') ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'LAVADOR', 'Lavador') ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'ASSISTENTE_FINANCEIRO', 'Assistente Financeiro') ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'FINANCEIRO', 'Financeiro') ON CONFLICT (name) DO NOTHING;
