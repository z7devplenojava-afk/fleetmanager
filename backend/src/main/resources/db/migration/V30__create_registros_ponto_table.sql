-- Criação da tabela de registros de ponto (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'registros_ponto') THEN
        CREATE TABLE registros_ponto (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            data_hora TIMESTAMP NOT NULL,
            tipo VARCHAR(20) NOT NULL,
            observacao TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    END IF;
END $$;
