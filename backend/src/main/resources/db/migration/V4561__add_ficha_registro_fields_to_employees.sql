-- Migration: V4561__add_ficha_registro_fields_to_employees.sql
-- Description: Add fields required for Ficha de Registro de Empregado PDF import

ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS ativ_federal VARCHAR(50),
    ADD COLUMN IF NOT EXISTS numero_recibo VARCHAR(50),
    ADD COLUMN IF NOT EXISTS raca_cor VARCHAR(30),
    ADD COLUMN IF NOT EXISTS sindicato VARCHAR(100),
    ADD COLUMN IF NOT EXISTS organograma VARCHAR(100),
    ADD COLUMN IF NOT EXISTS modo_pagamento VARCHAR(50),
    ADD COLUMN IF NOT EXISTS ctps_uf VARCHAR(2),
    ADD COLUMN IF NOT EXISTS codigo_funcionario VARCHAR(50),
    ADD COLUMN IF NOT EXISTS reservista_categoria VARCHAR(50),
    ADD COLUMN IF NOT EXISTS registro_profissional VARCHAR(50),
    ADD COLUMN IF NOT EXISTS data_registro_profissional DATE;
