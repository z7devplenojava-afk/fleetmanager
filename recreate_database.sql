-- Script para excluir e recriar o banco secured_guard_test
-- Execute este script no PostgreSQL

-- Conectar ao banco postgres (padrão)
\c postgres

-- Terminar todas as conexões com o banco secured_guard_test
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'secured_guard_test' AND pid <> pg_backend_pid();

-- Excluir o banco secured_guard_test
DROP DATABASE IF EXISTS secured_guard_test;

-- Criar o banco secured_guard_test novamente
CREATE DATABASE secured_guard_test
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'Portuguese_Brazil.1252'
    LC_CTYPE = 'Portuguese_Brazil.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;

-- Conectar ao novo banco
\c secured_guard_test

-- Habilitar extensão uuid-ossp se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verificar se o banco foi criado corretamente
SELECT current_database();
