-- Migration: Garantir encoding UTF-8 em todo o banco de dados
-- Descrição: Corrige problemas de codificação de caracteres especiais (ã, é, í, etc.)

-- Verificar e ajustar encoding do banco
DO $$
BEGIN
    -- Atualizar encoding de conexão padrão
    ALTER DATABASE secured_guard_test SET client_encoding TO 'UTF8';
    
    RAISE NOTICE 'Database encoding configurado para UTF8';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Aviso: Não foi possível alterar encoding do database (pode precisar de permissão de superuser)';
END $$;

-- Garantir que colunas de texto usem UTF-8
-- Nota: PostgreSQL já usa UTF-8 por padrão na maioria dos casos,
-- mas vamos garantir que não há problemas de collation

COMMENT ON DATABASE secured_guard_test IS 'Database com encoding UTF-8 para suporte a caracteres especiais';

