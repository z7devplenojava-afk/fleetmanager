ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS contract_id UUID;
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS work_post_id UUID;
