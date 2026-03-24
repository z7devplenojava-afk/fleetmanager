-- ============================================
-- CORRIGIR PARA O NÚMERO CORRETO
-- ============================================
-- O número 31971731747 NÃO EXISTE no WhatsApp
-- O número correto é 31971504213
-- ============================================

-- 1. Verificar número atual
SELECT 
    username AS cpf,
    name AS nome,
    whatsapp AS numero_atual
FROM users 
WHERE username = '00824310608';

-- 2. Atualizar para o número CORRETO (31971504213)
UPDATE users 
SET whatsapp = '31971504213',
    updated_at = CURRENT_TIMESTAMP
WHERE username = '00824310608';

-- 3. Verificar atualização
SELECT 
    username AS cpf,
    name AS nome,
    whatsapp AS numero_corrigido
FROM users 
WHERE username = '00824310608';

