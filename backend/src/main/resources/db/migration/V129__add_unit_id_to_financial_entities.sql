-- Migration para adicionar campo unit_id nas entidades financeiras
-- V246__add_unit_id_to_financial_entities.sql

-- 1. Criar uma unidade padrao para dados existentes
INSERT INTO units (id, name, description, address, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'Unidade Padrao',
    'Unidade padrao criada automaticamente para migracao de dados financeiros',
    'Endereco da Unidade Padrao',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 2. Obter o ID da unidade padrao criada
DO $$
DECLARE
    default_unit_id UUID;
BEGIN
    SELECT id INTO default_unit_id FROM units WHERE name = 'Unidade Padrao' LIMIT 1;
    
    -- 3. Adicionar coluna unit_id na tabela financial_transactions
    ALTER TABLE financial_transactions 
    ADD COLUMN unit_id UUID;
    
    -- 4. Atualizar registros existentes com a unidade padrao
    UPDATE financial_transactions 
    SET unit_id = default_unit_id 
    WHERE unit_id IS NULL;
    
    -- 5. Tornar a coluna unit_id obrigatoria
    ALTER TABLE financial_transactions 
    ALTER COLUMN unit_id SET NOT NULL;
    
    -- 6. Adicionar foreign key
    ALTER TABLE financial_transactions 
    ADD CONSTRAINT fk_financial_transactions_unit 
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE RESTRICT;
    
    -- 7. Adicionar coluna unit_id na tabela invoices
    ALTER TABLE invoices 
    ADD COLUMN unit_id UUID;
    
    -- 8. Atualizar registros existentes com a unidade padrao
    UPDATE invoices 
    SET unit_id = default_unit_id 
    WHERE unit_id IS NULL;
    
    -- 9. Tornar a coluna unit_id obrigatoria
    ALTER TABLE invoices 
    ALTER COLUMN unit_id SET NOT NULL;
    
    -- 10. Adicionar foreign key
    ALTER TABLE invoices 
    ADD CONSTRAINT fk_invoices_unit 
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE RESTRICT;
    
    -- 11. Criar indices para melhorar performance
    CREATE INDEX idx_financial_transactions_unit_id ON financial_transactions(unit_id);
    CREATE INDEX idx_invoices_unit_id ON invoices(unit_id);
    
END $$; 