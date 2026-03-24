-- Seed missing roles to synchronize with frontend and UserRole enum
INSERT INTO roles (id, name, description)
VALUES (gen_random_uuid(), 'FLEX_ADMIN', 'Admin Plataforma (Global)')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description)
VALUES (gen_random_uuid(), 'COMPANY_ADMIN', 'Admin Empresa (Tenant)')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description)
VALUES (gen_random_uuid(), 'ASSISTENCIA_RH', 'Assistência de RH')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description)
VALUES (gen_random_uuid(), 'DEPARTAMENTO_PESSOAL', 'Departamento Pessoal')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description)
VALUES (gen_random_uuid(), 'AUXI_ADMINISTRATIVO', 'Auxiliar Administrativo')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description)
VALUES (gen_random_uuid(), 'AUX_DEP', 'Auxiliar Depto. Pessoal')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description)
VALUES (gen_random_uuid(), 'TI_SUPORTE', 'TI / Suporte Técnico')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description)
VALUES (gen_random_uuid(), 'AUDITOR', 'Auditor / Consultor')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description)
VALUES (gen_random_uuid(), 'MOTORISTA', 'Motorista')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description)
VALUES (gen_random_uuid(), 'MECANICO', 'Mecânico')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description)
VALUES (gen_random_uuid(), 'PORTARIA', 'Portaria')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description)
VALUES (gen_random_uuid(), 'GESTOR_TRAFEGO', 'Gestor de Tráfego')
ON CONFLICT (name) DO NOTHING;
