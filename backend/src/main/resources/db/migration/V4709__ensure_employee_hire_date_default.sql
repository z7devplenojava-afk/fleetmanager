-- V4709: Preencher data de admissao para funcionarios sem hire_date
-- Evita excecoes de calculo de periodo aquisitivo no Portal do Funcionario
UPDATE employees 
SET hire_date = COALESCE(created_at::date, '2024-01-15'::date)
WHERE hire_date IS NULL;

