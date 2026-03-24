-- Script para criar o banco de dados da Evolution API

-- Criar o banco de dados evolution_db
CREATE DATABASE evolution_db
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Comentário
COMMENT ON DATABASE evolution_db IS 'Banco de dados para Evolution API - WhatsApp';

\c evolution_db;

-- Criar extensão para UUID (se necessário)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE evolution_db TO postgres;

