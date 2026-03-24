CREATE TABLE access_records (
    id UUID PRIMARY KEY,
    company_id UUID,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    document_number VARCHAR(100),
    vehicle_plate VARCHAR(20),
    purpose_of_visit VARCHAR(255),
    entry_time TIMESTAMP NOT NULL,
    exit_time TIMESTAMP,
    status VARCHAR(20),
    authorized_by VARCHAR(255),
    unit_id UUID,
    observations TEXT,
    CONSTRAINT fk_access_record_unit FOREIGN KEY (unit_id) REFERENCES units(id)
);

CREATE INDEX idx_access_records_company ON access_records(company_id);
CREATE INDEX idx_access_records_status ON access_records(status);
