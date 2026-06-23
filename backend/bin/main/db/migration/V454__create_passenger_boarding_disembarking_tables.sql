-- Create passengers table
CREATE TABLE IF NOT EXISTS passengers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    employee_id UUID,
    company_id UUID,
    route_id UUID,
    boarding_point_id UUID,
    shift VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    cost_center VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_passenger_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
    CONSTRAINT fk_passenger_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_passenger_route FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL,
    CONSTRAINT fk_passenger_boarding_point FOREIGN KEY (boarding_point_id) REFERENCES route_points(id) ON DELETE SET NULL
);

-- Create boardings table
CREATE TABLE IF NOT EXISTS boardings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL,
    passenger_id UUID NOT NULL,
    vehicle_id UUID,
    boarding_time TIMESTAMP,
    boarding_latitude DOUBLE PRECISION,
    boarding_longitude DOUBLE PRECISION,
    boarding_point_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'BOARDED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_boarding_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    CONSTRAINT fk_boarding_passenger FOREIGN KEY (passenger_id) REFERENCES passengers(id) ON DELETE CASCADE,
    CONSTRAINT fk_boarding_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    CONSTRAINT fk_boarding_boarding_point FOREIGN KEY (boarding_point_id) REFERENCES route_points(id) ON DELETE SET NULL
);

-- Create disembarkings table
CREATE TABLE IF NOT EXISTS disembarkings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boarding_id UUID NOT NULL UNIQUE,
    disembarking_time TIMESTAMP,
    disembarking_latitude DOUBLE PRECISION,
    disembarking_longitude DOUBLE PRECISION,
    disembarking_point_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_disembarking_boarding FOREIGN KEY (boarding_id) REFERENCES boardings(id) ON DELETE CASCADE,
    CONSTRAINT fk_disembarking_disembarking_point FOREIGN KEY (disembarking_point_id) REFERENCES route_points(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_passengers_company_id ON passengers(company_id);
CREATE INDEX IF NOT EXISTS idx_passengers_route_id ON passengers(route_id);
CREATE INDEX IF NOT EXISTS idx_passengers_active ON passengers(active);
CREATE INDEX IF NOT EXISTS idx_boardings_trip_id ON boardings(trip_id);
CREATE INDEX IF NOT EXISTS idx_boardings_passenger_id ON boardings(passenger_id);
