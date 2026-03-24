-- Corrigir formato do número de WhatsApp
-- Executar no DBeaver ou psql

-- OPÇÃO 1: Adicionar o 9 que está faltando (se for celular)
-- Números com 10 dígitos que começam com 31 (Minas Gerais)
UPDATE users 
SET whatsapp = CONCAT(
    SUBSTRING(whatsapp, 1, 2),  -- DDD: 31
    '9',                         -- Adicionar o 9
    SUBSTRING(whatsapp, 3)       -- Resto do número
)
WHERE whatsapp IS NOT NULL
  AND LENGTH(REGEXP_REPLACE(whatsapp, '[^0-9]', '', 'g')) = 10
  AND whatsapp ~ '^31[0-9]{8}$';  -- Números que começam com 31 e têm 8 dígitos depois

-- OPÇÃO 2: Adicionar DDI 55 para números com 11 dígitos
UPDATE users 
SET whatsapp = '55' || whatsapp
WHERE whatsapp IS NOT NULL
  AND LENGTH(REGEXP_REPLACE(whatsapp, '[^0-9]', '', 'g')) = 11
  AND NOT whatsapp LIKE '55%';

-- OPÇÃO 3: Atualizar manualmente um usuário específico
-- DESCOMENTE E AJUSTE CONFORME NECESSÁRIO:

-- Exemplo 1: Adicionar o 9 que está faltando
-- UPDATE users 
-- SET whatsapp = '31971423309'  -- 11 dígitos corretos
-- WHERE cpf = '00824310608';

-- Exemplo 2: Adicionar DDI completo
-- UPDATE users 
-- SET whatsapp = '5531971423309'  -- 13 dígitos com DDI
-- WHERE cpf = '00824310608';

-- VERIFICAR resultado:
SELECT 
    name,
    cpf,
    whatsapp,
    LENGTH(REGEXP_REPLACE(whatsapp, '[^0-9]', '', 'g')) as digitos
FROM users
WHERE whatsapp IS NOT NULL
ORDER BY name;

