-- ============================================
-- CORRIGIR NÚMERO DE WHATSAPP
-- ============================================
-- CPF: 00824310608
-- WhatsApp anterior: 5531971731747
-- WhatsApp correto: 31971731747
-- ============================================

-- 1. Verificar número atual
SELECT 
    username AS cpf,
    name AS nome,
    whatsapp AS numero_atual
FROM users 
WHERE username = '00824310608';

-- 2. Atualizar para o número correto
UPDATE users 
SET whatsapp = '31971731747',
    updated_at = CURRENT_TIMESTAMP
WHERE username = '00824310608';

-- 3. Verificar se foi atualizado
SELECT 
    username AS cpf,
    name AS nome,
    whatsapp AS numero_atualizado
FROM users 
WHERE username = '00824310608';

-- 4. Verificar todos os usuários com WhatsApp
SELECT 
    username AS cpf,
    name AS nome,
    whatsapp
FROM users 
WHERE whatsapp IS NOT NULL 
  AND whatsapp != ''
ORDER BY name;

