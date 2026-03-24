-- ====================================
-- PRD: FECHAMENTO MENSAL DE HORAS
-- Fase 5: Integração com PayrollItem
-- ====================================

-- Estender tabela payroll_items para suportar PayrollClosure
DO $$
BEGIN
    -- Adicionar colunas para suportar PayrollClosure
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_items' AND column_name = 'payroll_closure_id'
    ) THEN
        ALTER TABLE payroll_items 
        ADD COLUMN payroll_closure_id UUID REFERENCES payroll_closures(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_items' AND column_name = 'hours'
    ) THEN
        ALTER TABLE payroll_items 
        ADD COLUMN hours NUMERIC(10,2); -- Quantidade de horas (para itens baseados em horas)
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_items' AND column_name = 'unit_value'
    ) THEN
        ALTER TABLE payroll_items 
        ADD COLUMN unit_value NUMERIC(10,2); -- Valor unitário (ex: valor por hora)
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_items' AND column_name = 'category'
    ) THEN
        ALTER TABLE payroll_items 
        ADD COLUMN category VARCHAR(50); -- Categoria: EARNINGS, DEDUCTIONS, BENEFITS
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_items' AND column_name = 'reissued_by_id'
    ) THEN
        ALTER TABLE payroll_items 
        ADD COLUMN reissued_by_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_items' AND column_name = 'reissued_at'
    ) THEN
        ALTER TABLE payroll_items 
        ADD COLUMN reissued_at TIMESTAMP;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_items' AND column_name = 'reference_data'
    ) THEN
        ALTER TABLE payroll_items 
        ADD COLUMN reference_data JSONB; -- Metadados adicionais (ex: período, regras aplicadas)
    END IF;

    -- Criar índices
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payroll_items_payroll_closure_id'
    ) THEN
        CREATE INDEX idx_payroll_items_payroll_closure_id ON payroll_items(payroll_closure_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payroll_items_category'
    ) THEN
        CREATE INDEX idx_payroll_items_category ON payroll_items(category);
    END IF;

    -- Nota: payroll_id permanece NOT NULL conforme a tabela original
    -- A aplicação deve fornecer um payroll_id mesmo que o item venha de PayrollClosure
    -- Isso mantém compatibilidade com a estrutura existente
    
    COMMENT ON COLUMN payroll_items.payroll_closure_id IS 'Referência ao fechamento de ponto que gerou este item';
    COMMENT ON COLUMN payroll_items.hours IS 'Quantidade de horas (para cálculos baseados em horas)';
    COMMENT ON COLUMN payroll_items.unit_value IS 'Valor unitário (ex: valor por hora trabalhada)';
    COMMENT ON COLUMN payroll_items.category IS 'Categoria: EARNINGS (proventos), DEDUCTIONS (descontos), BENEFITS (benefícios)';
    COMMENT ON COLUMN payroll_items.reissued_by_id IS 'Usuário que reemitiu este item (se foi reprocessado)';
    COMMENT ON COLUMN payroll_items.reissued_at IS 'Data/hora da reemissão';
    COMMENT ON COLUMN payroll_items.reference_data IS 'Metadados adicionais em formato JSON';
END $$;





