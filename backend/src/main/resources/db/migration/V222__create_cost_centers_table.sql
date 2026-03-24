-- Create table cost_centers with correct status configuration
CREATE TABLE IF NOT EXISTS cost_centers (
    id UUID PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(1000),
    owner VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',  -- ATIVO, INATIVO, SUSPENSO
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_cost_center_code ON cost_centers(code);
CREATE UNIQUE INDEX IF NOT EXISTS uk_cost_center_name ON cost_centers(name);
CREATE INDEX IF NOT EXISTS idx_cost_centers_status ON cost_centers(status);



