-- ========================================
-- ATUALIZAR WHATSAPP PARA 31997142303
-- ========================================
-- Executar no DBeaver:
-- Banco: localhost:5432/secured_guard_dev
-- Usuario: postgres
-- Senha: postgres (provavelmente)
-- ========================================

-- 1. Verificar dados atuais
SELECT id, username, name, email, whatsapp 
FROM users 
WHERE username = '00824310608';

-- 2. Atualizar WhatsApp
UPDATE users 
SET whatsapp = '5531997142303' 
WHERE username = '00824310608';

-- 3. Confirmar atualização
SELECT id, username, name, email, whatsapp 
FROM users 
WHERE username = '00824310608';

-- ========================================
-- RESULTADO ESPERADO:
-- username: 00824310608
-- whatsapp: 5531997142303
-- ========================================

