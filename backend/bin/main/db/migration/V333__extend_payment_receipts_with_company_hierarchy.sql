-- Estende a tabela de comprovantes para suportar hierarquia de empresa semelhante aos holerites

ALTER TABLE payment_receipts
    ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS company_cnpj VARCHAR(20),
    ADD COLUMN IF NOT EXISTS company_sigla VARCHAR(10),
    ADD COLUMN IF NOT EXISTS company_id UUID;

-- Garante vínculo opcional com a tabela de empresas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_payment_receipts_company'
          AND table_name = 'payment_receipts'
    ) THEN
        ALTER TABLE payment_receipts
            ADD CONSTRAINT fk_payment_receipts_company
                FOREIGN KEY (company_id) REFERENCES companies(id);
    END IF;
END $$;

-- Preenche company_name com o nome debitado quando disponível
UPDATE payment_receipts
SET company_name = COALESCE(company_name, debited_name)
WHERE company_name IS NULL
  AND debited_name IS NOT NULL;

-- Normaliza CNPJ da empresa quando existente
UPDATE payment_receipts
SET company_cnpj = REGEXP_REPLACE(company_cnpj, '[^0-9]', '', 'g')
WHERE company_cnpj IS NOT NULL;

-- Vincula empresas conhecidas usando CNPJ
UPDATE payment_receipts pr
SET company_id = c.id,
    company_name = COALESCE(pr.company_name, c.name),
    company_sigla = c.sigla,
    company_cnpj = REGEXP_REPLACE(c.cnpj, '[^0-9]', '', 'g')
FROM companies c
WHERE pr.company_id IS NULL
  AND pr.company_cnpj IS NOT NULL
  AND REGEXP_REPLACE(pr.company_cnpj, '[^0-9]', '', 'g') = REGEXP_REPLACE(c.cnpj, '[^0-9]', '', 'g');

-- Vincula empresas pelo nome normalizado quando CNPJ não estiver disponível
UPDATE payment_receipts pr
SET company_id = c.id,
    company_sigla = c.sigla,
    company_cnpj = REGEXP_REPLACE(c.cnpj, '[^0-9]', '', 'g')
FROM companies c
WHERE pr.company_id IS NULL
  AND pr.company_name IS NOT NULL
  AND LOWER(REPLACE(REPLACE(REPLACE(pr.company_name, ' ', ''), '.', ''), '-', '')) =
      LOWER(REPLACE(REPLACE(REPLACE(c.name, ' ', ''), '.', ''), '-', ''));

CREATE INDEX IF NOT EXISTS idx_payment_receipts_company_hierarchy
    ON payment_receipts(company_id, company_sigla, company_name, year, month);

