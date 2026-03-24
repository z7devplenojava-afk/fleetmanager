CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    unit_id UUID NOT NULL,
    location_id UUID NOT NULL,
    estimated_duration BIGINT,
    checkpoints_required BOOLEAN NOT NULL DEFAULT false,
    geofence_enabled BOOLEAN NOT NULL DEFAULT false,
    default_radius_meters INTEGER DEFAULT 50,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_routes_unit_id ON routes(unit_id);
CREATE INDEX IF NOT EXISTS idx_routes_location_id ON routes(location_id);
