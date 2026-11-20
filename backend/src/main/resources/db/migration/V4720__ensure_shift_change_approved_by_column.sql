-- Compatibilidade para bancos nos quais a migration V372 não foi aplicada.
ALTER TABLE shift_change_forms
    ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255);
