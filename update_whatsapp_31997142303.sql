-- Atualizar WhatsApp para 31997142303
UPDATE users SET whatsapp = '5531997142303' WHERE username = '00824310608';

-- Verificar atualização
SELECT username, name, whatsapp FROM users WHERE username = '00824310608';

