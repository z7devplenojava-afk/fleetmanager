-- Migration: Adicionar campos bancários (banco, agencia, conta_corrente) na tabela employees
-- Data: 2025-01-XX
-- Descrição: Adiciona campos para armazenar dados bancários dos funcionários

-- Verificar se as colunas já existem antes de adicionar
DO $$
BEGIN
    -- Adicionar coluna banco se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'banco'
    ) THEN
        ALTER TABLE employees ADD COLUMN banco VARCHAR(100);
    END IF;

    -- Adicionar coluna agencia se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'agencia'
    ) THEN
        ALTER TABLE employees ADD COLUMN agencia VARCHAR(20);
    END IF;

    -- Adicionar coluna conta_corrente se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'conta_corrente'
    ) THEN
        ALTER TABLE employees ADD COLUMN conta_corrente VARCHAR(20);
    END IF;
END $$;


































