-- Create error_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
); 