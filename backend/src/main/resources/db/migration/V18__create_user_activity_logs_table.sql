CREATE TABLE user_activity_logs (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255),
    action VARCHAR(255),
    details TEXT,
    timestamp TIMESTAMP
); 