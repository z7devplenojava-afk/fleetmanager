-- Script para excluir e recriar o banco fluxbus_test
-- Execute este script no PostgreSQL

-- Conectar ao banco postgres (padrão)
\c postgres

-- Terminar todas as conexões com o banco fluxbus_test
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'fluxbus_test' AND pid <> pg_backend_pid();

-- Excluir o banco fluxbus_test
DROP DATABASE IF EXISTS fluxbus_test;

-- Criar o banco fluxbus_test novamente
CREATE DATABASE fluxbus_test
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'Portuguese_Brazil.1252'
    LC_CTYPE = 'Portuguese_Brazil.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;

-- Conectar ao novo banco
\c fluxbus_test

-- Habilitar extensão uuid-ossp se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verificar se o banco foi criado corretamente
SELECT current_database();
