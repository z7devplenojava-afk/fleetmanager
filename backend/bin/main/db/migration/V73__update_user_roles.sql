-- Migração para atualizar os roles para a nova estrutura
-- V202__update_user_roles.sql

-- Atualizar roles existentes para os novos roles
UPDATE users SET role = 'SUPER_ADMIN' WHERE role = 'CEO';
UPDATE users SET role = 'ADMIN' WHERE role = 'ADMIN';
UPDATE users SET role = 'RH' WHERE role = 'RH';
UPDATE users SET role = 'RH' WHERE role = 'DEPARTAMENTO_PESSOAL';
UPDATE users SET role = 'SUPERVISOR' WHERE role = 'GESTOR';
UPDATE users SET role = 'SUPERVISOR' WHERE role = 'SUPERVISOR';
UPDATE users SET role = 'COLABORADOR' WHERE role = 'COLABORADOR';
UPDATE users SET role = 'COLABORADOR' WHERE role = 'VIGILANTE';

-- Inserir novos grupos se não existirem
INSERT INTO user_groups (group_name, display_name, description, created_at, updated_at)
SELECT 'GRUPO_FINANCEIRO', 'Financeiro', 'Grupo para usuários do departamento financeiro', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_groups WHERE group_name = 'GRUPO_FINANCEIRO');

INSERT INTO user_groups (group_name, display_name, description, created_at, updated_at)
SELECT 'GRUPO_TI_SUPORTE', 'TI / Suporte Técnico', 'Grupo para usuários de TI e suporte técnico', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_groups WHERE group_name = 'GRUPO_TI_SUPORTE');

INSERT INTO user_groups (group_name, display_name, description, created_at, updated_at)
SELECT 'GRUPO_AUDITOR', 'Auditor / Consultor', 'Grupo para auditores e consultores externos', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_groups WHERE group_name = 'GRUPO_AUDITOR');

-- Atualizar descrições dos grupos existentes
UPDATE user_groups SET 
    display_name = 'Super Administrador',
    description = 'Grupo com acesso total e irrestrito a todas as funcionalidades'
WHERE group_name = 'GRUPO_SUPER_ADMIN';

UPDATE user_groups SET 
    display_name = 'Administrador',
    description = 'Grupo com acesso amplo, subordinado ao Super Admin'
WHERE group_name = 'GRUPO_ADMIN';

UPDATE user_groups SET 
    display_name = 'Supervisor',
    description = 'Grupo para coordenação de operações de equipes ou setores'
WHERE group_name = 'GRUPO_SUPERVISOR';

UPDATE user_groups SET 
    display_name = 'Recursos Humanos',
    description = 'Grupo para gerenciamento de informações contratuais e pessoais'
WHERE group_name = 'GRUPO_RH';

UPDATE user_groups SET 
    display_name = 'Colaboradores',
    description = 'Grupo para colaboradores com acesso limitado ao próprio perfil'
WHERE group_name = 'GRUPO_COLABORADORES'; 