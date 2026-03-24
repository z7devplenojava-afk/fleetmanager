-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Script para corrigir comprovantes salvos com mês errado
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
--
-- PROBLEMA: 
-- Comprovantes de outubro foram salvos como novembro devido ao
-- fallback que usava LocalDateTime.now().getMonthValue()
--
-- SOLUÇÃO:
-- Atualizar registros para o mês correto baseado no file_path
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. VER COMPROVANTES COM PROBLEMA (antes de corrigir)
SELECT id, employee_name, month, year, file_name, file_path 
FROM payment_receipts 
WHERE file_path LIKE '%_10_2025%' 
  AND month != 10
ORDER BY employee_name;

-- Se encontrar registros, significa que o file_path está correto mas o month está errado

-- 2. CORRIGIR - Atualizar month baseado no file_path
UPDATE payment_receipts 
SET month = 10,
    file_name = REPLACE(file_name, '_11_2025_', '_10_2025_'),
    file_path = REPLACE(file_path, '11_2025', '10_2025')
WHERE file_path LIKE '%11_2025%jose_mario_ramos%'
  OR (employee_name LIKE '%JOSE%MARIO%RAMOS%' AND month = 11 AND year = 2025);

-- 3. VERIFICAR RESULTADO
SELECT id, employee_name, month, year, file_name, file_path 
FROM payment_receipts 
WHERE employee_name LIKE '%JOSE%MARIO%RAMOS%'
  AND year = 2025
ORDER BY month;

-- 4. PREVENIR FUTUROS PROBLEMAS - Criar constraint de validação
-- (Opcional - só se quiser garantir que file_path e month estejam consistentes)

/*
ALTER TABLE payment_receipts ADD CONSTRAINT check_month_matches_filepath 
CHECK (
    (month = 1 AND file_path LIKE '%01_%') OR
    (month = 2 AND file_path LIKE '%02_%') OR
    (month = 3 AND file_path LIKE '%03_%') OR
    (month = 4 AND file_path LIKE '%04_%') OR
    (month = 5 AND file_path LIKE '%05_%') OR
    (month = 6 AND file_path LIKE '%06_%') OR
    (month = 7 AND file_path LIKE '%07_%') OR
    (month = 8 AND file_path LIKE '%08_%') OR
    (month = 9 AND file_path LIKE '%09_%') OR
    (month = 10 AND file_path LIKE '%10_%') OR
    (month = 11 AND file_path LIKE '%11_%') OR
    (month = 12 AND file_path LIKE '%12_%')
);
*/

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- NOTAS IMPORTANTES:
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
--
-- 1. Execute primeiro a query SELECT para ver os registros
-- 2. Verifique se o file_path físico existe
-- 3. Só então execute o UPDATE
-- 4. Verifique o resultado com o segundo SELECT
--
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

