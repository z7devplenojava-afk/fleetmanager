-- ========================================
-- SCRIPT MANUAL: Corrigir mês dos comprovantes
-- ========================================
-- Use este script caso a migration V324 não seja aplicada automaticamente
-- Execute no PostgreSQL: psql -U postgres -d secured_guard -f fix_receipts_manual.sql

-- 1. Ver situação atual
SELECT 
    COUNT(*) as total,
    month,
    year
FROM payment_receipts
WHERE month IS NOT NULL
GROUP BY month, year
ORDER BY year, month;

-- 2. Backup (segurança)
DROP TABLE IF EXISTS payment_receipts_backup_manual;
CREATE TABLE payment_receipts_backup_manual AS 
SELECT * FROM payment_receipts;

-- 3. Atualizar mês dos comprovantes
UPDATE payment_receipts
SET 
    month = CASE 
        WHEN month = 12 THEN 1
        ELSE month + 1
    END,
    year = CASE
        WHEN month = 12 THEN year + 1
        ELSE year
    END
WHERE month IS NOT NULL;

-- 4. Verificar resultado
SELECT 
    COUNT(*) as total,
    month,
    year
FROM payment_receipts
WHERE month IS NOT NULL
GROUP BY month, year
ORDER BY year, month;

-- 5. Mensagem de sucesso
SELECT '✅ Comprovantes atualizados com sucesso!' as resultado;

