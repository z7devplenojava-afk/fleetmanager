-- Migration V4693: integra faturas de locacao ao Contas a Receber e a Nota Fiscal
-- Cada fatura de locacao gera/atualiza um titulo em accounts_receivable.
-- A nota fiscal e gerada pelo sistema e disponibilizada em /api/rental-invoices/{id}/nfse.

ALTER TABLE rental_invoices
    ADD COLUMN IF NOT EXISTS receipt_date DATE,
    ADD COLUMN IF NOT EXISTS nfse_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS nfse_status VARCHAR(30),
    ADD COLUMN IF NOT EXISTS nfse_issue_date TIMESTAMP WITHOUT TIME ZONE,
    ADD COLUMN IF NOT EXISTS nfse_pdf_url VARCHAR(500);

ALTER TABLE accounts_receivable
    ADD COLUMN IF NOT EXISTS rental_invoice_id UUID;

DO $$
BEGIN
    ALTER TABLE accounts_receivable
        ADD CONSTRAINT fk_accounts_receivable_rental_invoice
        FOREIGN KEY (rental_invoice_id) REFERENCES rental_invoices(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_accounts_receivable_rental_invoice
    ON accounts_receivable(rental_invoice_id);

-- Uma fatura de locacao possui no maximo um titulo financeiro vinculado.
CREATE UNIQUE INDEX IF NOT EXISTS uk_accounts_receivable_rental_invoice
    ON accounts_receivable(rental_invoice_id)
    WHERE rental_invoice_id IS NOT NULL;

-- Garante a permissao de leitura para os perfis que ja usam o modulo.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('SUPER_ADMIN', 'ADMIN', 'OPERACIONAL', 'GESTOR_OPERACIONAL')
  AND p.name = 'RENTAL_MANAGEMENT_READ'
ON CONFLICT DO NOTHING;
