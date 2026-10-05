-- PRD Viasao Sao Silvestre - Fase 3: viagens operacionais ligadas as escalas
-- trips: schedule_id passa a ser opcional (viagens podem nascer de escalas_operacionais)
ALTER TABLE trips ALTER COLUMN schedule_id DROP NOT NULL;

ALTER TABLE trips ADD COLUMN IF NOT EXISTS escalas_operacionais_id UUID;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS route_id UUID;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS vehicle_id UUID;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS driver_id UUID;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS trip_date DATE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS planned_departure_time TIME;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS planned_arrival_time TIME;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS initial_km INTEGER;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS final_km INTEGER;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS passengers_expected INTEGER;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS passengers_realized INTEGER;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS occurrence TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS driver_confirmed_at TIMESTAMP;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS vehicle_confirmed_at TIMESTAMP;

ALTER TABLE trips DROP CONSTRAINT IF EXISTS fk_trips_escalas;
ALTER TABLE trips ADD CONSTRAINT fk_trips_escalas
    FOREIGN KEY (escalas_operacionais_id) REFERENCES escalas_operacionais(id) ON DELETE SET NULL;

ALTER TABLE trips DROP CONSTRAINT IF EXISTS fk_trips_route;
ALTER TABLE trips ADD CONSTRAINT fk_trips_route
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL;

ALTER TABLE trips DROP CONSTRAINT IF EXISTS fk_trips_vehicle;
ALTER TABLE trips ADD CONSTRAINT fk_trips_vehicle
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL;

ALTER TABLE trips DROP CONSTRAINT IF EXISTS fk_trips_driver;
ALTER TABLE trips ADD CONSTRAINT fk_trips_driver
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_trips_trip_date ON trips(trip_date);
CREATE INDEX IF NOT EXISTS idx_trips_route_id ON trips(route_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_escalas_id ON trips(escalas_operacionais_id);

-- DailyLog gerado ao finalizar a viagem
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS trip_id UUID;
ALTER TABLE daily_logs DROP CONSTRAINT IF EXISTS fk_daily_logs_trip;
ALTER TABLE daily_logs ADD CONSTRAINT fk_daily_logs_trip
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_daily_logs_trip_id ON daily_logs(trip_id);

-- Parte Diaria vinculada ao DailyLog da viagem
ALTER TABLE parte_diaria ADD COLUMN IF NOT EXISTS daily_log_id UUID;
ALTER TABLE parte_diaria DROP CONSTRAINT IF EXISTS fk_parte_diaria_daily_log;
ALTER TABLE parte_diaria ADD CONSTRAINT fk_parte_diaria_daily_log
    FOREIGN KEY (daily_log_id) REFERENCES daily_logs(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_parte_diaria_daily_log_id ON parte_diaria(daily_log_id);
