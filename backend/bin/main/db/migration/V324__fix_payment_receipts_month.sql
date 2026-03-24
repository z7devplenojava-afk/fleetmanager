-- ========================================
-- Migration V324: Corrige mês dos comprovantes
-- ========================================
-- 
-- PROBLEMA:
-- Os comprovantes foram importados com o mesmo mês do holerite,
-- mas a regra de negócio é: comprovante = mês do PAGAMENTO (holerite.mês + 1)
--
-- SOLUÇÃO:
-- Atualizar o campo 'month' para refletir o mês do pagamento
-- ========================================

-- Backup: Criar tabela temporária com dados originais (segurança)
CREATE TABLE IF NOT EXISTS payment_receipts_backup_v324 AS 
SELECT * FROM payment_receipts;

-- Atualizar mês para mês seguinte
-- Regra: Comprovante de setembro (09) -> Pagamento em outubro (10)
UPDATE payment_receipts
SET 
    month = CASE 
        WHEN month = 12 THEN 1  -- Dezembro -> Janeiro
        ELSE month + 1          -- Qualquer outro mês -> mês + 1
    END,
    year = CASE
        WHEN month = 12 THEN year + 1  -- Se era dezembro, incrementa ano
        ELSE year                      -- Caso contrário, mantém ano
    END
WHERE month IS NOT NULL;

-- Log de alterações
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE '✅ V324: Atualizados % registros de comprovantes para mês de pagamento', updated_count;
END $$;

-- Comentário explicativo
COMMENT ON TABLE payment_receipts IS 'Tabela de comprovantes de pagamento. Campo month refere-se ao mês do PAGAMENTO (transferência bancária), não ao mês trabalhado.';

