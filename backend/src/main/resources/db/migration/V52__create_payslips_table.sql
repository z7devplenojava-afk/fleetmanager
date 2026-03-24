CREATE TABLE IF NOT EXISTS payslips (
    id UUID PRIMARY KEY,
    employee_name VARCHAR(255) NOT NULL,
    cpf VARCHAR(20) NOT NULL,
    month VARCHAR(50) NOT NULL,
    year VARCHAR(4) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    processed_at TIMESTAMP NOT NULL
); 