-- Script para diagnosticar o problema de envio via WhatsApp

-- 1. Verificar usuários com WhatsApp cadastrado
SELECT 
    u.id,
    u.name AS "Nome",
    u.username AS "CPF (username)",
    u.whatsapp AS "WhatsApp",
    u.email AS "Email",
    u.active AS "Ativo"
FROM users u
WHERE u.username = '00824310608'
ORDER BY u.name;

-- 2. Verificar TODOS os usuários que têm WhatsApp
SELECT 
    u.id,
    u.name AS "Nome",
    u.username AS "CPF (username)",
    u.whatsapp AS "WhatsApp",
    LENGTH(u.whatsapp) AS "Tamanho WhatsApp"
FROM users u
WHERE u.whatsapp IS NOT NULL 
  AND u.whatsapp != ''
ORDER BY u.name;

-- 3. Verificar estrutura da tabela payslips (tipos de dados)
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'payslips'
ORDER BY ordinal_position;

-- 4. Verificar payslips existentes
SELECT 
    id,
    employee_name,
    cpf,
    month,
    year,
    file_name,
    processed_at
FROM payslips
WHERE cpf = '00824310608'
ORDER BY year DESC, month DESC;

-- 5. CORREÇÃO: Alterar tipos dos campos month e year
-- Execute este bloco se os campos estiverem como character varying
DO $$
BEGIN
    -- Corrigir month
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payslips' 
        AND column_name = 'month' 
        AND data_type = 'character varying'
    ) THEN
        ALTER TABLE payslips ALTER COLUMN month TYPE INTEGER USING month::integer;
        RAISE NOTICE '✅ Campo month alterado de VARCHAR para INTEGER';
    END IF;
    
    -- Corrigir year
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payslips' 
        AND column_name = 'year' 
        AND data_type = 'character varying'
    ) THEN
        ALTER TABLE payslips ALTER COLUMN year TYPE INTEGER USING year::integer;
        RAISE NOTICE '✅ Campo year alterado de VARCHAR para INTEGER';
    END IF;
END $$;

-- 6. Verificar novamente após a correção
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'payslips'
  AND column_name IN ('month', 'year')
ORDER BY ordinal_position;

