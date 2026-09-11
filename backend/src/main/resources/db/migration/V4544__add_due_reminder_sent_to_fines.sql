-- Flag de envio de alerta de vencimento (evita reenvio diário da mesma multa)
ALTER TABLE fines ADD COLUMN IF NOT EXISTS due_reminder_sent BOOLEAN DEFAULT FALSE;
