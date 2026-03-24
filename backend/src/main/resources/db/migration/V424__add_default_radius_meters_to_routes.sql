-- Migration V424: Add missing columns to routes table
-- These columns are required by the Route entity

-- Add geofencing related columns
ALTER TABLE routes ADD COLUMN IF NOT EXISTS default_radius_meters INTEGER DEFAULT 50;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS geofence_enabled BOOLEAN DEFAULT false;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS checkpoints_required BOOLEAN DEFAULT false;

-- Add other potentially missing columns
ALTER TABLE routes ADD COLUMN IF NOT EXISTS estimated_duration BIGINT;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE routes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
