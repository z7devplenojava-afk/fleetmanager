-- Migration to add fleet_number to vehicles
ALTER TABLE vehicles ADD COLUMN fleet_number VARCHAR(50);

-- Create an index to improve search performance by fleet number
CREATE INDEX idx_vehicles_fleet_number ON vehicles(fleet_number);
