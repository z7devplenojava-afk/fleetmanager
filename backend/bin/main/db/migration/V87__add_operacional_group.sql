-- Adicionar grupo OPERACIONAL caso não exista
INSERT INTO user_groups (group_name, display_name, description)
SELECT 'GRUPO_OPERACIONAL', 'Operacional', 'Equipe operacional'
WHERE NOT EXISTS (
    SELECT 1 FROM user_groups WHERE group_name = 'GRUPO_OPERACIONAL'
);

-- Inserir permissões padrão para GRUPO_OPERACIONAL (somente se não existirem)
INSERT INTO user_group_permissions (group_id, permission)
SELECT id, 'VIEW_PAYSLIP' FROM user_groups
WHERE group_name = 'GRUPO_OPERACIONAL'
  AND NOT EXISTS (
      SELECT 1 FROM user_group_permissions
      WHERE group_id = (SELECT id FROM user_groups WHERE group_name = 'GRUPO_OPERACIONAL')
        AND permission = 'VIEW_PAYSLIP'
  );

INSERT INTO user_group_permissions (group_id, permission)
SELECT id, 'DOWNLOAD_PAYSLIP' FROM user_groups
WHERE group_name = 'GRUPO_OPERACIONAL'
  AND NOT EXISTS (
      SELECT 1 FROM user_group_permissions
      WHERE group_id = (SELECT id FROM user_groups WHERE group_name = 'GRUPO_OPERACIONAL')
        AND permission = 'DOWNLOAD_PAYSLIP'
  );

INSERT INTO user_group_permissions (group_id, permission)
SELECT id, 'EDIT_PROFILE' FROM user_groups
WHERE group_name = 'GRUPO_OPERACIONAL'
  AND NOT EXISTS (
      SELECT 1 FROM user_group_permissions
      WHERE group_id = (SELECT id FROM user_groups WHERE group_name = 'GRUPO_OPERACIONAL')
        AND permission = 'EDIT_PROFILE'
  );

INSERT INTO user_group_permissions (group_id, permission)
SELECT id, 'VIEW_EMPLOYEES' FROM user_groups
WHERE group_name = 'GRUPO_OPERACIONAL'
  AND NOT EXISTS (
      SELECT 1 FROM user_group_permissions
      WHERE group_id = (SELECT id FROM user_groups WHERE group_name = 'GRUPO_OPERACIONAL')
        AND permission = 'VIEW_EMPLOYEES'
  );

INSERT INTO user_group_permissions (group_id, permission)
SELECT id, 'VIEW_CONTRACTS' FROM user_groups
WHERE group_name = 'GRUPO_OPERACIONAL'
  AND NOT EXISTS (
      SELECT 1 FROM user_group_permissions
      WHERE group_id = (SELECT id FROM user_groups WHERE group_name = 'GRUPO_OPERACIONAL')
        AND permission = 'VIEW_CONTRACTS'
  );

INSERT INTO user_group_permissions (group_id, permission)
SELECT id, 'VIEW_REPORTS' FROM user_groups
WHERE group_name = 'GRUPO_OPERACIONAL'
  AND NOT EXISTS (
      SELECT 1 FROM user_group_permissions
      WHERE group_id = (SELECT id FROM user_groups WHERE group_name = 'GRUPO_OPERACIONAL')
        AND permission = 'VIEW_REPORTS'
  );

INSERT INTO user_group_permissions (group_id, permission)
SELECT id, 'VIEW_FLEET' FROM user_groups
WHERE group_name = 'GRUPO_OPERACIONAL'
  AND NOT EXISTS (
      SELECT 1 FROM user_group_permissions
      WHERE group_id = (SELECT id FROM user_groups WHERE group_name = 'GRUPO_OPERACIONAL')
        AND permission = 'VIEW_FLEET'
  );
