CREATE TABLE remanejamentos (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL,
    tipo VARCHAR(32) NOT NULL,
    origem VARCHAR(255),
    destino VARCHAR(255),
    data_remanejamento DATE NOT NULL,
    observacao VARCHAR(500),
    CONSTRAINT fk_remanejamento_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
); 