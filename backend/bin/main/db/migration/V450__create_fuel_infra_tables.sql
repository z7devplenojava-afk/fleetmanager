-- Database migration for Fuel Infrastructure management

CREATE TABLE fuel_tanks (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    capacity DECIMAL(12, 2) NOT NULL,
    current_level DECIMAL(12, 2) NOT NULL,
    fuel_type VARCHAR(50) NOT NULL,
    company_id UUID,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE TABLE fuel_pumps (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    fuel_tank_id UUID NOT NULL,
    last_meter_reading DECIMAL(12, 2) NOT NULL,
    company_id UUID,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE TABLE fuel_deliveries (
    id UUID PRIMARY KEY,
    delivery_date DATE NOT NULL,
    invoice_number VARCHAR(255) NOT NULL,
    supplier VARCHAR(255) NOT NULL,
    liters DECIMAL(12, 2) NOT NULL,
    price_per_liter DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    fuel_tank_id UUID NOT NULL,
    company_id UUID,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE TABLE fuel_pump_readings (
    id UUID PRIMARY KEY,
    reading_date DATE NOT NULL,
    initial_value DECIMAL(12, 2) NOT NULL,
    final_value DECIMAL(12, 2) NOT NULL,
    total_liters DECIMAL(12, 2) NOT NULL,
    fuel_pump_id UUID NOT NULL,
    company_id UUID,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

-- Indices for performance and filtering
CREATE INDEX idx_fuel_tanks_company ON fuel_tanks(company_id);
CREATE INDEX idx_fuel_pumps_company ON fuel_pumps(company_id);
CREATE INDEX idx_fuel_deliveries_company ON fuel_deliveries(company_id);
CREATE INDEX idx_fuel_pump_readings_company ON fuel_pump_readings(company_id);
CREATE INDEX idx_fuel_pumps_tank ON fuel_pumps(fuel_tank_id);
CREATE INDEX idx_fuel_deliveries_tank ON fuel_deliveries(fuel_tank_id);
CREATE INDEX idx_fuel_pump_readings_pump ON fuel_pump_readings(fuel_pump_id);
