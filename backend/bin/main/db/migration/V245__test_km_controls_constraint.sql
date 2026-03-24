-- Teste da constraint de KM controls
-- V1017__test_km_controls_constraint.sql

-- Verificar se a constraint existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'chk_km_controls_total_km_positive'
    ) THEN
        RAISE NOTICE 'Constraint chk_km_controls_total_km_positive existe';
    ELSE
        RAISE NOTICE 'Constraint chk_km_controls_total_km_positive NÃO existe';
    END IF;
END $$;

-- Mostrar a definição da constraint
SELECT 
    constraint_name, 
    check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'chk_km_controls_total_km_positive';
