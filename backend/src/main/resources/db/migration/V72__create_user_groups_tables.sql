-- Criar tabela de grupos de usuários
CREATE TABLE user_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de permissões dos grupos
CREATE TABLE user_group_permissions (
    group_id UUID NOT NULL,
    permission VARCHAR(100) NOT NULL,
    PRIMARY KEY (group_id, permission),
    FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE CASCADE
);

-- Criar tabela de associação usuário-grupo
CREATE TABLE user_group_membership (
    user_id UUID NOT NULL,
    group_id UUID NOT NULL,
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
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPER_ADMIN'), 'VIEW_PAYSLIP'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPER_ADMIN'), 'DOWNLOAD_PAYSLIP'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPER_ADMIN'), 'EDIT_PROFILE'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPER_ADMIN'), 'VIEW_EMPLOYEES'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPER_ADMIN'), 'MANAGE_EMPLOYEES'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPER_ADMIN'), 'VIEW_REPORTS'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPER_ADMIN'), 'MANAGE_SYSTEM'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPER_ADMIN'), 'VIEW_CLIENTS'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPER_ADMIN'), 'MANAGE_CLIENTS'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPER_ADMIN'), 'VIEW_CONTRACTS'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPER_ADMIN'), 'MANAGE_CONTRACTS'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPER_ADMIN'), 'VIEW_FINANCIAL'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPER_ADMIN'), 'MANAGE_FINANCIAL'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPER_ADMIN'), 'VIEW_FLEET'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPER_ADMIN'), 'MANAGE_FLEET'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPER_ADMIN'), 'VIEW_DOCUMENTS'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPER_ADMIN'), 'MANAGE_DOCUMENTS');

-- Inserir permissões para GRUPO_ADMIN
INSERT INTO user_group_permissions (group_id, permission) VALUES
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_ADMIN'), 'VIEW_PAYSLIP'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_ADMIN'), 'DOWNLOAD_PAYSLIP'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_ADMIN'), 'EDIT_PROFILE'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_ADMIN'), 'VIEW_EMPLOYEES'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_ADMIN'), 'MANAGE_EMPLOYEES'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_ADMIN'), 'VIEW_REPORTS'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_ADMIN'), 'VIEW_CLIENTS'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_ADMIN'), 'MANAGE_CLIENTS'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_ADMIN'), 'VIEW_CONTRACTS'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_ADMIN'), 'MANAGE_CONTRACTS'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_ADMIN'), 'VIEW_FINANCIAL'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_ADMIN'), 'MANAGE_FINANCIAL'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_ADMIN'), 'VIEW_FLEET'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_ADMIN'), 'MANAGE_FLEET'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_ADMIN'), 'VIEW_DOCUMENTS'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_ADMIN'), 'MANAGE_DOCUMENTS');

-- Inserir permissões para GRUPO_GESTOR
INSERT INTO user_group_permissions (group_id, permission) VALUES
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_GESTOR'), 'VIEW_PAYSLIP'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_GESTOR'), 'DOWNLOAD_PAYSLIP'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_GESTOR'), 'EDIT_PROFILE'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_GESTOR'), 'VIEW_EMPLOYEES'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_GESTOR'), 'MANAGE_EMPLOYEES'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_GESTOR'), 'VIEW_REPORTS'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_GESTOR'), 'VIEW_CLIENTS'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_GESTOR'), 'MANAGE_CLIENTS'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_GESTOR'), 'VIEW_CONTRACTS'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_GESTOR'), 'MANAGE_CONTRACTS'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_GESTOR'), 'VIEW_FINANCIAL'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_GESTOR'), 'VIEW_FLEET'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_GESTOR'), 'VIEW_DOCUMENTS');

-- Inserir permissões para GRUPO_RH
INSERT INTO user_group_permissions (group_id, permission) VALUES
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_RH'), 'VIEW_PAYSLIP'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_RH'), 'DOWNLOAD_PAYSLIP'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_RH'), 'EDIT_PROFILE'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_RH'), 'VIEW_EMPLOYEES'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_RH'), 'MANAGE_EMPLOYEES'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_RH'), 'VIEW_REPORTS'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_RH'), 'VIEW_CLIENTS'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_RH'), 'VIEW_CONTRACTS'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_RH'), 'VIEW_FINANCIAL'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_RH'), 'VIEW_FLEET'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_RH'), 'VIEW_DOCUMENTS');

-- Inserir permissões para GRUPO_DPE
INSERT INTO user_group_permissions (group_id, permission) VALUES
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_DPE'), 'VIEW_PAYSLIP'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_DPE'), 'DOWNLOAD_PAYSLIP'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_DPE'), 'EDIT_PROFILE'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_DPE'), 'VIEW_EMPLOYEES'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_DPE'), 'MANAGE_EMPLOYEES'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_DPE'), 'VIEW_REPORTS'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_DPE'), 'VIEW_CLIENTS'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_DPE'), 'VIEW_CONTRACTS'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_DPE'), 'VIEW_FINANCIAL'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_DPE'), 'VIEW_FLEET'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_DPE'), 'VIEW_DOCUMENTS');

-- Inserir permissões para GRUPO_SUPERVISOR
INSERT INTO user_group_permissions (group_id, permission) VALUES
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPERVISOR'), 'VIEW_PAYSLIP'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPERVISOR'), 'DOWNLOAD_PAYSLIP'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPERVISOR'), 'EDIT_PROFILE'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPERVISOR'), 'VIEW_EMPLOYEES'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPERVISOR'), 'VIEW_REPORTS'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPERVISOR'), 'VIEW_FLEET');

-- Inserir permissões para GRUPO_COLABORADORES
INSERT INTO user_group_permissions (group_id, permission) VALUES
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_COLABORADORES'), 'VIEW_PAYSLIP'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_COLABORADORES'), 'DOWNLOAD_PAYSLIP'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_COLABORADORES'), 'EDIT_PROFILE');

-- Inserir permissões para GRUPO_VIGILANTES
INSERT INTO user_group_permissions (group_id, permission) VALUES
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_VIGILANTES'), 'VIEW_PAYSLIP'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_VIGILANTES'), 'DOWNLOAD_PAYSLIP'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_VIGILANTES'), 'EDIT_PROFILE'); 