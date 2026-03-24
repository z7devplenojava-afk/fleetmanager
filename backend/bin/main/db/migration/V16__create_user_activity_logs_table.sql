-- Criação da tabela de logs de atividade do usuário (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activity_logs') THEN
        CREATE TABLE user_activity_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            username VARCHAR(255),
            action VARCHAR(255),
            details TEXT,
            timestamp TIMESTAMP
        );
    END IF;
END $$;
