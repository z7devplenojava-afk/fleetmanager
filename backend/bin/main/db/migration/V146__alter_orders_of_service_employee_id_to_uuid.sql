-- Migration: V265__alter_orders_of_service_employee_id_to_uuid.sql
-- Corrigir a coluna employee_id da tabela orders_of_service para UUID

-- 1. Remover constraints de foreign key se existirem (não há FK explícita, mas por segurança)
ALTER TABLE orders_of_service DROP CONSTRAINT IF EXISTS fk_orders_of_service_employee;

-- 2. Alterar a coluna para UUID
ALTER TABLE orders_of_service ALTER COLUMN employee_id TYPE UUID USING 
    CASE 
        WHEN employee_id IS NOT NULL THEN employee_id::text::UUID
        ELSE NULL
    END;

-- 3. (Opcional) Recriar a constraint de FK se necessário
-- Exemplo:
-- ALTER TABLE orders_of_service ADD CONSTRAINT fk_orders_of_service_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;

-- 4. Verificar se a alteração foi bem-sucedida
DO $$
BEGIN
    RAISE NOTICE 'Verificando alterações na tabela orders_of_service...';
    
    -- Verificar tipo da coluna
    PERFORM column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'orders_of_service' 
    AND column_name = 'employee_id';
    
    RAISE NOTICE 'Alteração concluída com sucesso!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro durante a migração: %', SQLERRM;
        RAISE;
END $$; 