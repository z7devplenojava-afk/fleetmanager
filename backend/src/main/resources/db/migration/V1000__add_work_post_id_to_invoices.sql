ALTER TABLE invoices ADD COLUMN IF NOT EXISTS work_post_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_invoices_work_post'
    ) THEN
        ALTER TABLE invoices ADD CONSTRAINT fk_invoices_work_post
            FOREIGN KEY (work_post_id) REFERENCES work_posts(id);
    END IF;
END $$;
