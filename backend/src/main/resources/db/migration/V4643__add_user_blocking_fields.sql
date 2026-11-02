-- Campos de bloqueio administrativo de usuário (por tempo definido pelo Administrador)
ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_by VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_reason VARCHAR(500);

CREATE INDEX IF NOT EXISTS idx_users_blocked ON users(blocked);

UPDATE users SET blocked = FALSE WHERE blocked IS NULL;
