-- OPCIONAL V331: Conceder consentimento para usuários existentes
-- ⚠️ ATENÇÃO: Este script é OPCIONAL e deve ser executado APENAS após aprovação jurídica
-- 
-- PROPÓSITO:
-- Este script concede consentimento WhatsApp para usuários que já possuem número cadastrado.
-- Isso facilita a transição, mas DEVE ter base legal documentada.
--
-- REQUISITOS LEGAIS:
-- 1. Aprovação do Departamento Jurídico
-- 2. Base legal documentada (ex: cláusula em contrato de trabalho)
-- 3. Comunicação prévia aos funcionários
-- 4. Política de privacidade atualizada
--
-- ALTERNATIVA RECOMENDADA:
-- Solicitar novo consentimento explícito de cada funcionário através do sistema.
--
-- ⚠️ NÃO EXECUTE ESTE SCRIPT SEM AUTORIZAÇÃO JURÍDICA!
-- ⚠️ Violação da LGPD pode resultar em multas de até R$ 50 milhões!
--
-- Para executar este script:
-- 1. Renomear arquivo removendo "OPCIONAL_"
-- 2. Obter aprovação jurídica por escrito
-- 3. Documentar base legal no sistema
-- 4. Comunicar funcionários
-- 5. Reiniciar aplicação

-- OPÇÃO A: Conceder consentimento para TODOS com WhatsApp
-- (requer base legal forte - ex: cláusula contratual)
/*
UPDATE users 
SET whatsapp_consent = TRUE,
    whatsapp_consent_date = NOW(),
    whatsapp_consent_ip = '0.0.0.0',
    whatsapp_consent_user_agent = 'Sistema - Migração automática V331 (Base legal: Contrato de trabalho cláusula X)'
WHERE whatsapp IS NOT NULL 
  AND whatsapp != ''
  AND (whatsapp_consent IS NULL OR whatsapp_consent = FALSE);
*/

-- OPÇÃO B: Registrar consentimento apenas para funcionários ativos
-- (mais conservadora, requer mesma base legal)
/*
UPDATE users 
SET whatsapp_consent = TRUE,
    whatsapp_consent_date = NOW(),
    whatsapp_consent_ip = '0.0.0.0',
    whatsapp_consent_user_agent = 'Sistema - Migração automática V331 (Base legal: Contrato de trabalho cláusula X)'
WHERE whatsapp IS NOT NULL 
  AND whatsapp != ''
  AND (whatsapp_consent IS NULL OR whatsapp_consent = FALSE)
  AND active = TRUE;
*/

-- OPÇÃO C (RECOMENDADA): Apenas registrar no log a necessidade de consentimento
-- Não concede consentimento automaticamente
DO $$
DECLARE
    total_sem_consentimento INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_sem_consentimento
    FROM users
    WHERE whatsapp IS NOT NULL 
      AND whatsapp != ''
      AND (whatsapp_consent IS NULL OR whatsapp_consent = FALSE);
    
    RAISE NOTICE '📊 RELATÓRIO DE CONSENTIMENTO WHATSAPP:';
    RAISE NOTICE '  - Total de usuários com WhatsApp cadastrado SEM consentimento: %', total_sem_consentimento;
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ AÇÃO NECESSÁRIA:';
    RAISE NOTICE '  1. Consultar departamento jurídico sobre base legal';
    RAISE NOTICE '  2. Comunicar funcionários sobre nova política';
    RAISE NOTICE '  3. Solicitar consentimento explícito através do sistema';
    RAISE NOTICE '  OU';
    RAISE NOTICE '  4. Documentar base legal existente e executar OPÇÃO A ou B acima';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 IMPORTANTE: Não enviar mensagens WhatsApp sem consentimento!';
END $$;

-- Query útil para relatório de auditoria
COMMENT ON TABLE users IS 'Tabela de usuários com controle de consentimento WhatsApp (LGPD compliant)';

-- Criar view para facilitar auditoria
CREATE OR REPLACE VIEW v_whatsapp_consent_audit AS
SELECT 
    u.id,
    u.username,
    u.name,
    u.email,
    u.whatsapp,
    u.whatsapp_consent,
    u.whatsapp_consent_date,
    u.whatsapp_consent_ip,
    CASE 
        WHEN u.whatsapp IS NULL OR u.whatsapp = '' THEN 'SEM_WHATSAPP'
        WHEN u.whatsapp_consent = TRUE THEN 'CONSENTIMENTO_ATIVO'
        WHEN u.whatsapp_consent = FALSE THEN 'CONSENTIMENTO_REVOGADO'
        ELSE 'AGUARDANDO_CONSENTIMENTO'
    END as status_consentimento,
    e.document as cpf
FROM users u
LEFT JOIN employees e ON e.user_id = u.id;

COMMENT ON VIEW v_whatsapp_consent_audit IS 'View de auditoria de consentimento WhatsApp para compliance LGPD';

-- Índice para melhorar performance de consultas de auditoria
CREATE INDEX IF NOT EXISTS idx_users_whatsapp_consent_date 
ON users(whatsapp_consent_date) 
WHERE whatsapp_consent = TRUE;

COMMENT ON INDEX idx_users_whatsapp_consent_date IS 'Índice para consultas de auditoria por data de consentimento';

