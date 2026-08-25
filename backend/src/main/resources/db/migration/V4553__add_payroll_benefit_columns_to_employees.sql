-- =============================================================================
-- V4553__add_payroll_benefit_columns_to_employees.sql
-- Descrição: Adiciona colunas de benefícios, descontos, horas extras e afastamento
--            na tabela employees e garante a existência da empresa Viação São Silvestre.
-- =============================================================================

-- 1. Garante a empresa Viação São Silvestre com CNPJ 71.055.644/0006-30
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM companies 
        WHERE REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '-', ''), '/', '') = '71055644000630'
    ) THEN
        INSERT INTO companies (
            id,
            name,
            trade_name,
            cnpj,
            sigla,
            status,
            type,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'VIAÇÃO SÃO SILVESTRE S.A.',
            'Viação São Silvestre',
            '71.055.644/0006-30',
            'VSS',
            'ACTIVE',
            'FILIAL',
            NOW(),
            NOW()
        );
    END IF;
END $$;

-- 2. Adiciona colunas financeiras e de controle de benefícios na tabela employees
ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS mensalidade_plano_saude NUMERIC(15, 2),
    ADD COLUMN IF NOT EXISTS coparticipacao_saude NUMERIC(15, 2),
    ADD COLUMN IF NOT EXISTS plano_odontologico NUMERIC(15, 2),
    ADD COLUMN IF NOT EXISTS vale_transporte NUMERIC(15, 2),
    ADD COLUMN IF NOT EXISTS desconto_multas NUMERIC(15, 2),
    ADD COLUMN IF NOT EXISTS desconto_avarias NUMERIC(15, 2),
    ADD COLUMN IF NOT EXISTS vale_adiantamento NUMERIC(15, 2),
    ADD COLUMN IF NOT EXISTS adicional_noturno NUMERIC(15, 2),
    ADD COLUMN IF NOT EXISTS horas_extras_50 NUMERIC(15, 2),
    ADD COLUMN IF NOT EXISTS horas_extras_60 NUMERIC(15, 2),
    ADD COLUMN IF NOT EXISTS horas_extras_100 NUMERIC(15, 2),
    ADD COLUMN IF NOT EXISTS afastamento_motivo VARCHAR(255),
    ADD COLUMN IF NOT EXISTS afastamento_data DATE;
