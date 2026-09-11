-- =============================================================================
-- V4552__fix_stock_items_unique_code_per_company.sql
-- Descrição: Remove a unique constraint GLOBAL de stock_items.code e
--            substitui por unique composta (company_id + code).
--            Isso permite que empresas diferentes compartilhem o mesmo código
--            de produto em seus respectivos estoques.
-- Contexto: A constraint UNIQUE original bloqueava importação massiva de
--            itens quando duas empresas usavam o mesmo código (ex: "CAMISA-P").
-- =============================================================================

-- Tenta DROPAR a constraint conhecida gerada automaticamente pelo PostgreSQL
-- (padrão: <tabela>_<coluna>_key = stock_items_code_key)
ALTER TABLE stock_items DROP CONSTRAINT IF EXISTS stock_items_code_key;

-- Dropa também o nome que eventualmente poderia ter sido criado via JPA/Hibernate
ALTER TABLE stock_items DROP CONSTRAINT IF EXISTS uk_stock_items_code_unique;
ALTER TABLE stock_items DROP CONSTRAINT IF EXISTS uk_stock_items_code;

-- Dropa qualquer unique antiga sobre a coluna code (caso de migration manual)
-- (PostgreSQL usa o operador DROP CONSTRAINT IF EXISTS para nomes conhecidos)

-- Cria a nova UNIQUE CONSTRAINT COMPOSTA (company_id + code)
ALTER TABLE stock_items
    ADD CONSTRAINT uk_stock_items_company_code
    UNIQUE (company_id, code);

-- ---------------------------------------------------------------------------
-- Atualiza índices para performance
-- ---------------------------------------------------------------------------
DROP INDEX IF EXISTS idx_stock_items_code;

CREATE INDEX IF NOT EXISTS idx_stock_items_company_code
    ON stock_items (company_id, code);
