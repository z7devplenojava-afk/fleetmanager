-- Criação da tabela de rotas (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rotas') THEN
        CREATE TABLE rotas (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            nome_rota VARCHAR(255) NOT NULL,
            numero_rota INTEGER UNIQUE NOT NULL,
            turno VARCHAR(50) NOT NULL,
            supervisor VARCHAR(255) NOT NULL,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END $$;
