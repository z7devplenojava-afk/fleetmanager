-- Create agencies table manually
CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY,
    bank_id UUID,
    code VARCHAR(50),
    short_name VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    manager VARCHAR(150),
    manager_email VARCHAR(150),
    manager_phone VARCHAR(50),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(120),
    state VARCHAR(10),
    zip_code VARCHAR(20),
    notes TEXT,
    status VARCHAR(30) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE
);

-- Add optional FK to banks table if exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'banks'
    ) THEN
        ALTER TABLE agencies
        ADD CONSTRAINT IF NOT EXISTS fk_agencies_bank
        FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_agencies_code ON agencies(code);
CREATE INDEX IF NOT EXISTS idx_agencies_name ON agencies(name);
