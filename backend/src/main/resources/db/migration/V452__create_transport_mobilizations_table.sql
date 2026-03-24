CREATE TABLE transport_mobilizations (
    id UUID PRIMARY KEY,
    vehicle_id UUID NOT NULL,
    driver_id UUID,
    type VARCHAR(30) NOT NULL,
    occurred_at TIMESTAMP NOT NULL,
    km_reading INTEGER,
    odometer_photo_url VARCHAR(500),
    json_data TEXT,
    damage_data TEXT,
    parts_request_data TEXT,
    observations TEXT,
    photos TEXT,
    company_id UUID,
    sync_status VARCHAR(20) DEFAULT 'SYNCED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transport_mobilizations_vehicle_id ON transport_mobilizations(vehicle_id);
CREATE INDEX idx_transport_mobilizations_company_id ON transport_mobilizations(company_id);
CREATE INDEX idx_transport_mobilizations_type ON transport_mobilizations(type);
