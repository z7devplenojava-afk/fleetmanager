-- Create table cost_centers
CREATE TABLE IF NOT EXISTS cost_centers (
    id UUID PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(1000),
    owner VARCHAR(100),
    status VARCHAR(16) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_cost_center_code ON cost_centers(code);
CREATE UNIQUE INDEX IF NOT EXISTS uk_cost_center_name ON cost_centers(name);



