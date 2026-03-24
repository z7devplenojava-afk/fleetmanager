-- Multi-tenant: company_id em users, tema_cor em companies
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);

ALTER TABLE companies ADD COLUMN IF NOT EXISTS tema_cor VARCHAR(50);

-- Preencher company_id de users a partir do employee (primeiro employee vinculado)
UPDATE users u
SET company_id = (
    SELECT e.company_id FROM employees e
    WHERE e.user_id = u.id AND e.company_id IS NOT NULL
    LIMIT 1
)
WHERE u.company_id IS NULL;
