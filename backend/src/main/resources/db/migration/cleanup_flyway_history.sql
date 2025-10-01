-- Script para limpar histórico do Flyway se necessário
-- Execute este script diretamente no banco se houver problemas com migrações

-- Verificar migrações aplicadas
SELECT version, description, installed_on, success 
FROM flyway_schema_history 
ORDER BY installed_rank;

-- Remover migrações específicas se necessário (descomente as linhas abaixo)
-- DELETE FROM flyway_schema_history WHERE version IN ('V413', 'V414', 'V415');

-- Ou limpar todo o histórico (CUIDADO: isso fará o Flyway reaplicar todas as migrações)
-- DELETE FROM flyway_schema_history;

-- Verificar se a tabela km_controls existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'km_controls'
);

-- Verificar estrutura da tabela km_controls
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'km_controls'
ORDER BY ordinal_position;
