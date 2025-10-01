CREATE TABLE IF NOT EXISTS user_permissions (
    user_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    PRIMARY KEY (user_id, permission_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
); 