-- Garante que a tabela 'employees' tenha todas as colunas usadas pelo modelo Java,
-- servindo como fallback para ambientes onde migrations anteriores não rodaram.
DO $$
BEGIN
    -- Campos bancários básicos
    ALTER TABLE employees
        ADD COLUMN IF NOT EXISTS banco            VARCHAR(100),
        ADD COLUMN IF NOT EXISTS agencia          VARCHAR(20),
        ADD COLUMN IF NOT EXISTS conta_corrente   VARCHAR(20);

    -- Campos de empresa usados pelo modelo Employee
    ALTER TABLE employees
        ADD COLUMN IF NOT EXISTS empresa_nome     VARCHAR(100),
        ADD COLUMN IF NOT EXISTS empresa_endereco VARCHAR(255),
        ADD COLUMN IF NOT EXISTS empresa_cnpj     VARCHAR(20);

    RAISE NOTICE 'Colunas da tabela employees verificadas/atualizadas com sucesso.';
END $$;

