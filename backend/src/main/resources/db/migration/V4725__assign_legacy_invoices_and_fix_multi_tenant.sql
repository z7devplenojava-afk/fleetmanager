-- Atribuir faturas legadas sem empresa à Viação São Silvestre S.A.
-- Isso garante isolamento multi-tenant estrito: empresas novas (como WEG Agência de Viagens e Turismo / WGTurismo)
-- iniciam com a sua base limpa (zero registros) até cadastrarem seus próprios dados.
UPDATE invoices 
SET company_id = '54492e05-36dd-4789-bfbc-8c7e4d0285e5', 
    company_sigla = 'VSS' 
WHERE company_id IS NULL;

-- Para stock_items, atribuir apenas onde o código não colide na mesma empresa
UPDATE stock_items s
SET company_id = '54492e05-36dd-4789-bfbc-8c7e4d0285e5'
WHERE s.company_id IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM stock_items s2 
      WHERE s2.company_id = '54492e05-36dd-4789-bfbc-8c7e4d0285e5' 
        AND s2.code = s.code
  );

-- Também fornecedores legados sem empresa
UPDATE suppliers 
SET company_id = '54492e05-36dd-4789-bfbc-8c7e4d0285e5' 
WHERE company_id IS NULL;
