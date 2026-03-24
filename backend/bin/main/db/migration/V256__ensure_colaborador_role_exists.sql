-- Ensure COLABORADOR role exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'COLABORADOR') THEN
        INSERT INTO roles (id, name, description)
        VALUES (gen_random_uuid(), 'COLABORADOR', 'Funcionário colaborador');
    END IF;
END $$;


