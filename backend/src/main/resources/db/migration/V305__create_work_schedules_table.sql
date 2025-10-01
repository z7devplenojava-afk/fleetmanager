-- Create table work_schedules
CREATE TABLE IF NOT EXISTS work_schedules (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL,
    location_id UUID NOT NULL,
    schedule_date DATE NOT NULL,
    shift VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    observations TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    
    CONSTRAINT fk_work_schedule_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
    CONSTRAINT fk_work_schedule_location FOREIGN KEY (location_id) REFERENCES work_posts(id),
    CONSTRAINT chk_work_schedule_shift CHECK (shift IN ('DAY', 'NIGHT', 'MIXED')),
    CONSTRAINT chk_work_schedule_status CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_work_schedule_employee ON work_schedules(employee_id);
CREATE INDEX IF NOT EXISTS idx_work_schedule_location ON work_schedules(location_id);
CREATE INDEX IF NOT EXISTS idx_work_schedule_date ON work_schedules(schedule_date);
CREATE INDEX IF NOT EXISTS idx_work_schedule_status ON work_schedules(status);
