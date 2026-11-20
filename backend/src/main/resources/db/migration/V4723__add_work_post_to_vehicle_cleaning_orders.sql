ALTER TABLE vehicle_cleaning_orders
    ADD COLUMN IF NOT EXISTS work_post_id UUID REFERENCES work_posts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cleaning_orders_work_post
    ON vehicle_cleaning_orders(work_post_id);
