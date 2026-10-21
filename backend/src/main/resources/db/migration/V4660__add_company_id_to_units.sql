-- Adiciona company_id para isolamento multi-tenant na tabela units
ALTER TABLE units ADD COLUMN IF NOT EXISTS company_id UUID;

-- Preencher a partir do cliente
UPDATE units u
SET company_id = c.company_id
FROM clients c
WHERE u.client_id = c.id
  AND u.company_id IS NULL
  AND c.company_id IS NOT NULL;

-- Preencher a partir da filial
UPDATE units u
SET company_id = b.company_id
FROM branches b
WHERE u.branch_id = b.id
  AND u.company_id IS NULL
  AND b.company_id IS NOT NULL;

-- Preencher a partir dos funcionarios da unidade
UPDATE units u
SET company_id = e.company_id
FROM employees e
WHERE e.unit_id = u.id
  AND u.company_id IS NULL
  AND e.company_id IS NOT NULL;

-- Propagar a empresa das unidades pai para unidades filhas
DO $$
BEGIN
    LOOP
        UPDATE units u
        SET company_id = p.company_id
        FROM units p
        WHERE u.parent_id = p.id
          AND u.company_id IS NULL
          AND p.company_id IS NOT NULL;

        EXIT WHEN NOT FOUND;
    END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_units_company_id ON units(company_id);
