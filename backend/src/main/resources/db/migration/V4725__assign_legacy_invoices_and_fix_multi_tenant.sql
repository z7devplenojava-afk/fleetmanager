-- Atribuir faturas legadas sem empresa à Viação São Silvestre S.A., quando ela existir.
-- Em ambientes CI/test a empresa legada pode não ter sido criada; nesse caso os
-- registros órfãos permanecem sem tenant (invisíveis a qualquer empresa) ao invés
-- de quebrar a inicialização do Flyway com violação de chave estrangeira.
DO $$
DECLARE
    vss_id UUID;
BEGIN
    SELECT id INTO vss_id
    FROM companies
    WHERE sigla = 'VSS'
       OR name ILIKE '%Silvestre%'
    ORDER BY CASE WHEN sigla = 'VSS' THEN 0 ELSE 1 END
    LIMIT 1;

    IF vss_id IS NOT NULL THEN
        UPDATE invoices
        SET company_id = vss_id,
            company_sigla = 'VSS'
        WHERE company_id IS NULL;

        -- stock_items: apenas onde o código não colide na mesma empresa
        UPDATE stock_items s
        SET company_id = vss_id
        WHERE s.company_id IS NULL
          AND NOT EXISTS (
              SELECT 1 FROM stock_items s2
              WHERE s2.company_id = vss_id
                AND s2.code = s.code
          );

        UPDATE suppliers
        SET company_id = vss_id
        WHERE company_id IS NULL;
    END IF;
END $$;
