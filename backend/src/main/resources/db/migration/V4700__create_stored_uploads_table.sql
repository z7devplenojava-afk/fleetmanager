CREATE TABLE IF NOT EXISTS stored_uploads (
    id UUID PRIMARY KEY,
    category VARCHAR(120) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(120),
    file_size BIGINT,
    data BYTEA NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_stored_uploads_cat_name UNIQUE (category, file_name)
);

CREATE INDEX IF NOT EXISTS idx_stored_uploads_cat_name ON stored_uploads (category, file_name);

