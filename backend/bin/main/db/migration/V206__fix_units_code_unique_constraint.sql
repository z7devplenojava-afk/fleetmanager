-- Remover códigos duplicados mantendo apenas o mais recente
WITH duplicates AS (
    SELECT id, code, 
           ROW_NUMBER() OVER (PARTITION BY code ORDER BY created_at DESC) as rn
    FROM units
    WHERE code IS NOT NULL
)
DELETE FROM units
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Adicionar constraint UNIQUE na coluna code (permitindo NULL)
-- No PostgreSQL, NULL values não violam a constraint UNIQUE
ALTER TABLE units
ADD CONSTRAINT uk_units_code UNIQUE (code);

