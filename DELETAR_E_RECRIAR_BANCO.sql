-- ⚠️ SCRIPT PARA DELETAR E RECRIAR O BANCO DE DADOS ⚠️
-- Execute este script no DBeaver/PgAdmin conectado ao banco postgres (NÃO no fluxbus)

-- 1. DESCONECTAR TODAS AS CONEXÕES ATIVAS
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'fluxbus'
  AND pid <> pg_backend_pid();

-- 2. DELETAR O BANCO DE DADOS
DROP DATABASE IF EXISTS fluxbus;

-- 3. RECRIAR O BANCO DE DADOS
CREATE DATABASE fluxbus
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'Portuguese_Brazil.1252'
    LC_CTYPE = 'Portuguese_Brazil.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- 4. CONECTAR AO BANCO fluxbus E HABILITAR EXTENSÃO UUID
\c fluxbus

-- Habilitar extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ✅ PRONTO! Agora você pode:
-- 1. Conectar ao banco fluxbus no DBeaver
-- 2. Reiniciar o backend: java -jar backend/target/fluxbus-1.0.0.jar --spring.profiles.active=test
-- 3. O Flyway vai executar TODAS as migrations do zero
-- 4. Backend vai iniciar perfeitamente! 🚀

