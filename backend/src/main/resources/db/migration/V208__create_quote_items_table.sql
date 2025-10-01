CREATE TABLE quote_items (
    id BIGSERIAL PRIMARY KEY,
    quote_id BIGINT NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quote_id) REFERENCES quotes(id)
);

CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id); 