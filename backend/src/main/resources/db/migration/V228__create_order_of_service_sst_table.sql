CREATE TABLE order_of_service_sst (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    status VARCHAR(50) NOT NULL,
    responsible VARCHAR(255) NOT NULL,
    issue_date TIMESTAMP NOT NULL,
    execution_date TIMESTAMP,
    document_url VARCHAR(500),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
); 