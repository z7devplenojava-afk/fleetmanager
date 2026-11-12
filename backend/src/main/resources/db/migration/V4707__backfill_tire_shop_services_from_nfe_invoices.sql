-- Backfill idempotente para listar em Serviços de Borracharia notas de recapagem/borracharia já importadas em invoices (ex: JGX RECAPAGEM)

INSERT INTO tire_shop_services (
    id,
    company_id,
    service_number,
    service_name,
    supplier_id,
    supplier_name,
    quantity,
    unit_amount,
    total_amount,
    service_date,
    due_date,
    boleto_url,
    boleto_original_name,
    linha_digitavel,
    barcode,
    invoice_id,
    invoice_number,
    nf_number,
    nf_key,
    beneficiary_name,
    beneficiary_cnpj,
    generate_payable,
    notes,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    i.company_id,
    'SB-IMP-' || UPPER(SUBSTRING(REPLACE(i.id::text, '-', ''), 1, 6)),
    LEFT(COALESCE(NULLIF(TRIM(i.description), ''), 'Serviço de Recapagem / Borracharia'), 200),
    i.supplier_id,
    COALESCE(s.name, i.supplier_name),
    1,
    COALESCE(i.amount, 0),
    COALESCE(i.amount, 0),
    COALESCE(i.issue_date, i.due_date, CURRENT_DATE),
    i.due_date,
    i.boleto_url,
    i.boleto_original_name,
    i.linha_digitavel,
    i.barcode,
    i.id,
    i.invoice_number,
    CASE
        WHEN i.invoice_number ~* '^NF[- ]' THEN SPLIT_PART(REGEXP_REPLACE(i.invoice_number, '^NF[- ]+', '', 'i'), '/', 1)
        ELSE i.invoice_number
    END,
    i.nfe_key,
    COALESCE(s.name, i.supplier_name),
    s.cnpj,
    TRUE,
    i.notes,
    COALESCE(i.created_at, CURRENT_TIMESTAMP),
    CURRENT_TIMESTAMP
FROM invoices i
JOIN suppliers s ON s.id = i.supplier_id
WHERE NOT EXISTS (
    SELECT 1 FROM tire_shop_services tss WHERE tss.invoice_id = i.id
)
AND (
    UPPER(COALESCE(s.name, '')) LIKE '%RECAPAG%'
    OR UPPER(COALESCE(s.name, '')) LIKE '%BORRACH%'
    OR UPPER(COALESCE(s.name, '')) LIKE '%RECAUCHUT%'
    OR UPPER(COALESCE(i.supplier_name, '')) LIKE '%RECAPAG%'
    OR UPPER(COALESCE(i.supplier_name, '')) LIKE '%BORRACH%'
    OR UPPER(COALESCE(i.description, '')) LIKE '%RECAPAG%'
    OR UPPER(COALESCE(i.description, '')) LIKE '%BORRACH%'
    OR UPPER(COALESCE(i.category, '')) LIKE '%BORRACH%'
);

