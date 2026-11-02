-- V4675: Adiciona campo CPF na tabela users e sincroniza com os funcionários já vinculados

ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);
CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);

-- Sincronizar CPF dos usuários a partir do documento dos funcionários vinculados
UPDATE users u
SET cpf = e.document
FROM employees e
WHERE e.user_id = u.id
  AND e.document IS NOT NULL
  AND (u.cpf IS NULL OR u.cpf = '');

-- Limpar referências de logos órfãs inexistentes no disco
UPDATE companies 
SET logo_url = NULL 
WHERE logo_url ILIKE '%e9654118-53a8-4dd8-b57c-bc50997f081b%';

UPDATE company_configs 
SET logo_url = NULL 
WHERE logo_url ILIKE '%e9654118-53a8-4dd8-b57c-bc50997f081b%';

