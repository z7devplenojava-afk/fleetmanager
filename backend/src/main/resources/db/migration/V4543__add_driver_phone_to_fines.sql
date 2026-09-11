-- Telefone (WhatsApp) do motorista para notificação de multas registradas no nome dele
ALTER TABLE fines ADD COLUMN IF NOT EXISTS driver_phone VARCHAR(20);
