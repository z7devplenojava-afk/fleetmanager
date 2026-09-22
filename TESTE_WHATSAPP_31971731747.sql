-- Testar com o número que escaneou o QR Code
-- Banco: localhost:5432/fluxbus_dev

UPDATE users 
SET whatsapp = '5531971731747' 
WHERE username = '00824310608';

SELECT username, name, whatsapp FROM users WHERE username = '00824310608';

