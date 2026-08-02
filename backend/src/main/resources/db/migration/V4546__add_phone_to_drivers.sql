-- Telefone/WhatsApp do motorista (usado para notificações de multa e limpeza)
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
