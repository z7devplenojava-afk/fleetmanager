CREATE TABLE IF NOT EXISTS time_records (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL,
    record_date DATE NOT NULL,
    entry_time TIME,
    exit_time TIME,
    entry_lunch_time TIME,
    exit_lunch_time TIME,
    status VARCHAR(20) NOT NULL,
    justification VARCHAR(500),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
); 