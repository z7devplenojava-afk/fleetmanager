-- Criar tabela de grupos de usuários
CREATE TABLE user_groups (
    id BIGSERIAL PRIMARY KEY,
    group_name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de permissões dos grupos
CREATE TABLE user_group_permissions (
    group_id BIGINT NOT NULL,
    permission VARCHAR(100) NOT NULL,
    PRIMARY KEY (group_id, permission),
    FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE CASCADE
);

-- Criar tabela de associação usuário-grupo
CREATE TABLE user_group_membership (
    user_id UUID NOT NULL,
    group_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, group_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE CASCADE
);

-- Inserir grupos padrão
INSERT INTO user_groups (group_name, display_name, description) VALUES
('GRUPO_SUPER_ADMIN', 'Super Administrador', 'Acesso total ao sistema'),
('GRUPO_ADMIN', 'Administrador', 'Administração do sistema'),
('GRUPO_GESTOR', 'Gestor', 'Gestão de contratos e colaboradores'),
('GRUPO_RH', 'Recursos Humanos', 'Gestão de recursos humanos'),
('GRUPO_DPE', 'Departamento Pessoal', 'Departamento pessoal'),
('GRUPO_SUPERVISOR', 'Supervisor', 'Supervisão de equipes'),
('GRUPO_COLABORADORES', 'Colaboradores', 'Colaboradores da empresa'),
('GRUPO_VIGILANTES', 'Vigilantes', 'Vigilantes de segurança');

-- Inserir permissões para GRUPO_SUPER_ADMIN
INSERT INTO user_group_permissions (group_id, permission) VALUES
(1, 'VIEW_PAYSLIP'),
(1, 'DOWNLOAD_PAYSLIP'),
(1, 'EDIT_PROFILE'),
(1, 'VIEW_EMPLOYEES'),
(1, 'MANAGE_EMPLOYEES'),
(1, 'VIEW_REPORTS'),
(1, 'MANAGE_SYSTEM'),
(1, 'VIEW_CLIENTS'),
(1, 'MANAGE_CLIENTS'),
(1, 'VIEW_CONTRACTS'),
(1, 'MANAGE_CONTRACTS'),
(1, 'VIEW_FINANCIAL'),
(1, 'MANAGE_FINANCIAL'),
(1, 'VIEW_FLEET'),
(1, 'MANAGE_FLEET'),
(1, 'VIEW_DOCUMENTS'),
(1, 'MANAGE_DOCUMENTS');

-- Inserir permissões para GRUPO_ADMIN
INSERT INTO user_group_permissions (group_id, permission) VALUES
(2, 'VIEW_PAYSLIP'),
(2, 'DOWNLOAD_PAYSLIP'),
(2, 'EDIT_PROFILE'),
(2, 'VIEW_EMPLOYEES'),
(2, 'MANAGE_EMPLOYEES'),
(2, 'VIEW_REPORTS'),
(2, 'VIEW_CLIENTS'),
(2, 'MANAGE_CLIENTS'),
(2, 'VIEW_CONTRACTS'),
(2, 'MANAGE_CONTRACTS'),
(2, 'VIEW_FINANCIAL'),
(2, 'MANAGE_FINANCIAL'),
(2, 'VIEW_FLEET'),
(2, 'MANAGE_FLEET'),
(2, 'VIEW_DOCUMENTS'),
(2, 'MANAGE_DOCUMENTS');

-- Inserir permissões para GRUPO_GESTOR
INSERT INTO user_group_permissions (group_id, permission) VALUES
(3, 'VIEW_PAYSLIP'),
(3, 'DOWNLOAD_PAYSLIP'),
(3, 'EDIT_PROFILE'),
(3, 'VIEW_EMPLOYEES'),
(3, 'MANAGE_EMPLOYEES'),
(3, 'VIEW_REPORTS'),
(3, 'VIEW_CLIENTS'),
(3, 'MANAGE_CLIENTS'),
(3, 'VIEW_CONTRACTS'),
(3, 'MANAGE_CONTRACTS'),
(3, 'VIEW_FINANCIAL'),
(3, 'VIEW_FLEET'),
(3, 'VIEW_DOCUMENTS');

-- Inserir permissões para GRUPO_RH
INSERT INTO user_group_permissions (group_id, permission) VALUES
(4, 'VIEW_PAYSLIP'),
(4, 'DOWNLOAD_PAYSLIP'),
(4, 'EDIT_PROFILE'),
(4, 'VIEW_EMPLOYEES'),
(4, 'MANAGE_EMPLOYEES'),
(4, 'VIEW_REPORTS'),
(4, 'VIEW_CLIENTS'),
(4, 'VIEW_CONTRACTS'),
(4, 'VIEW_FINANCIAL'),
(4, 'VIEW_FLEET'),
(4, 'VIEW_DOCUMENTS');

-- Inserir permissões para GRUPO_DPE
INSERT INTO user_group_permissions (group_id, permission) VALUES
(5, 'VIEW_PAYSLIP'),
(5, 'DOWNLOAD_PAYSLIP'),
(5, 'EDIT_PROFILE'),
(5, 'VIEW_EMPLOYEES'),
(5, 'MANAGE_EMPLOYEES'),
(5, 'VIEW_REPORTS'),
(5, 'VIEW_CLIENTS'),
(5, 'VIEW_CONTRACTS'),
(5, 'VIEW_FINANCIAL'),
(5, 'VIEW_FLEET'),
(5, 'VIEW_DOCUMENTS');

-- Inserir permissões para GRUPO_SUPERVISOR
INSERT INTO user_group_permissions (group_id, permission) VALUES
(6, 'VIEW_PAYSLIP'),
(6, 'DOWNLOAD_PAYSLIP'),
(6, 'EDIT_PROFILE'),
(6, 'VIEW_EMPLOYEES'),
(6, 'VIEW_REPORTS'),
(6, 'VIEW_FLEET');

-- Inserir permissões para GRUPO_COLABORADORES
INSERT INTO user_group_permissions (group_id, permission) VALUES
(7, 'VIEW_PAYSLIP'),
(7, 'DOWNLOAD_PAYSLIP'),
(7, 'EDIT_PROFILE');

-- Inserir permissões para GRUPO_VIGILANTES
INSERT INTO user_group_permissions (group_id, permission) VALUES
(8, 'VIEW_PAYSLIP'),
(8, 'DOWNLOAD_PAYSLIP'),
(8, 'EDIT_PROFILE'); 