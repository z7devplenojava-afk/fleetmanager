-- Add employee_id column as a foreign key to schedules table
ALTER TABLE schedules ADD COLUMN employee_id UUID;
ALTER TABLE schedules ADD CONSTRAINT fk_schedules_employee FOREIGN KEY (employee_id) REFERENCES employees(id); 