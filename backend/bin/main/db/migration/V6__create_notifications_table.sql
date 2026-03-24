-- Criação da tabela de notificações (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        CREATE TABLE notifications (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL,
            title VARCHAR(100) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) NOT NULL,
            read BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    END IF;
END $$;
