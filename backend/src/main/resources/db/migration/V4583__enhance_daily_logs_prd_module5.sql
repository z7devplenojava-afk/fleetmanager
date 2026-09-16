-- PRD 1.0 - MÓDULO 5: Execução de Campo & Apontamento (Parte Diária & Telemetria)

-- RF-05.1: identificação do motorista e horários de início/término de cada percurso
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255);
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS start_time TIMESTAMP;
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS end_time TIMESTAMP;
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS activity_description TEXT;

-- RF-05.1: assinatura do Motorista e do Representante/Fiscal da Contratante
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS driver_signature TEXT;
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS driver_signed_at TIMESTAMP;
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS inspector_signature TEXT;
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS inspector_name VARCHAR(255);
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS inspector_signed_at TIMESTAMP;

-- RF-05.2: conciliação com rastreamento satelital
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS telemetry_km INTEGER;
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS telemetry_diff_km INTEGER;
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS telemetry_diff_pct NUMERIC(6,4);
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS telemetry_status VARCHAR(30)
    DEFAULT 'NOT_RECONCILED'; -- NOT_RECONCILED, WITHIN_TOLERANCE, DIVERGENT
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS telemetry_imported_at TIMESTAMP;
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS telemetry_source VARCHAR(100);

-- RF-05.3: classificação automática de viagens extras
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS extra_trip BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS extra_trip_reason VARCHAR(50); -- WEEKEND, HOLIDAY, OUTSIDE_SHIFT
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS extra_trip_auto_classified BOOLEAN NOT NULL DEFAULT FALSE;
