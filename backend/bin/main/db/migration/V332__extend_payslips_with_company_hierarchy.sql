-- Adiciona campos para hierarquia Empresa -> Setor/Posto -> Período -> Holerite
ALTER TABLE payslips
    ADD COLUMN IF NOT EXISTS company_sigla VARCHAR(10),
    ADD COLUMN IF NOT EXISTS company_id UUID,
    ADD COLUMN IF NOT EXISTS work_post_name VARCHAR(150);

-- Garante vínculo opcional com a tabela de empresas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_payslips_company'
          AND table_name = 'payslips'
          AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE payslips
            ADD CONSTRAINT fk_payslips_company
            FOREIGN KEY (company_id) REFERENCES companies(id);
    END IF;
END $$;

-- Atualiza registros existentes utilizando o CNPJ para preencher sigla e vínculo
UPDATE payslips p
SET company_id = c.id,
    company_sigla = c.sigla
FROM companies c
WHERE p.company_id IS NULL
  AND p.company_cnpj IS NOT NULL
  AND REGEXP_REPLACE(c.cnpj, '[^0-9]', '', 'g') = REGEXP_REPLACE(p.company_cnpj, '[^0-9]', '', 'g');

-- Índice auxiliar para consultas agrupadas por empresa e setor/posto
CREATE INDEX IF NOT EXISTS idx_payslips_company_hierarchy
    ON payslips(company_id, company_sigla, work_post_name, year, month, cpf);

