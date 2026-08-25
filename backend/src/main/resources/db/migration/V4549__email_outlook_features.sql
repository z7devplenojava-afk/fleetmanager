-- Funcionalidades estilo Outlook no módulo de e-mails

-- Assinatura da conta de e-mail (inserida automaticamente ao compor)
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS signature TEXT;

-- Anexos de composição (upload antes do envio) podem existir sem mensagem vinculada
ALTER TABLE email_message_attachments ALTER COLUMN message_id DROP NOT NULL;
