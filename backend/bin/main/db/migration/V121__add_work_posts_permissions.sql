-- Migration: V233__add_work_posts_permissions.sql
-- Description: Add work posts permissions to existing user groups

-- Add work posts permissions to GRUPO_SUPERVISOR
INSERT INTO user_group_permissions (group_id, permission) VALUES
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPERVISOR'), 'WORK_POSTS_READ'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPERVISOR'), 'WORK_POSTS_CREATE'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPERVISOR'), 'WORK_POSTS_WRITE'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_SUPERVISOR'), 'WORK_POSTS_DELETE');

-- Add work posts permissions to GRUPO_DPE
INSERT INTO user_group_permissions (group_id, permission) VALUES
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_DPE'), 'WORK_POSTS_READ'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_DPE'), 'WORK_POSTS_CREATE'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_DPE'), 'WORK_POSTS_WRITE');

-- Add work posts permissions to GRUPO_RH
INSERT INTO user_group_permissions (group_id, permission) VALUES
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_RH'), 'WORK_POSTS_READ'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_RH'), 'WORK_POSTS_CREATE'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_RH'), 'WORK_POSTS_WRITE');

-- Add work posts permissions to GRUPO_FINANCEIRO
INSERT INTO user_group_permissions (group_id, permission) VALUES
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_FINANCEIRO'), 'WORK_POSTS_READ');

-- Add work posts permissions to GRUPO_ADMIN
INSERT INTO user_group_permissions (group_id, permission) VALUES
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_ADMIN'), 'WORK_POSTS_READ'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_ADMIN'), 'WORK_POSTS_CREATE'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_ADMIN'), 'WORK_POSTS_WRITE'),
((SELECT id FROM user_groups WHERE group_name = 'GRUPO_ADMIN'), 'WORK_POSTS_DELETE'); 