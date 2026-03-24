-- =====================================================
-- Migration V277: Tornar registration_number opcional
-- =====================================================
-- Data: 27/10/2025
-- Descrição: Remove a obrigatoriedade do campo registration_number
--            pois o arquivo será enviado para contabilidade

-- Alterar coluna registration_number para aceitar NULL
ALTER TABLE employees 
ALTER COLUMN registration_number DROP NOT NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN employees.registration_number IS 'Número de registro do funcionário (opcional) - Campo será preenchido pela contabilidade';

