ALTER TABLE schedules
    ADD COLUMN IF NOT EXISTS schedule_recurrence VARCHAR(30);
