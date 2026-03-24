-- Alterar o tamanho do campo cpf na tabela payslips para suportar códigos de funcionário
ALTER TABLE payslips ALTER COLUMN cpf TYPE VARCHAR(20); 