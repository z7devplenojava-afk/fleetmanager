-- Adicionar campos de nascimento, sexo, grau de instrução e matrícula do eSocial na tabela employees
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS municipio_nascimento VARCHAR(100),
ADD COLUMN IF NOT EXISTS estado_nascimento VARCHAR(2),
ADD COLUMN IF NOT EXISTS sexo VARCHAR(20),
ADD COLUMN IF NOT EXISTS matricula_esocial VARCHAR(50);

-- Comentários nas colunas
COMMENT ON COLUMN employees.municipio_nascimento IS 'Município de nascimento do funcionário';
COMMENT ON COLUMN employees.estado_nascimento IS 'Estado de nascimento do funcionário (UF)';
COMMENT ON COLUMN employees.sexo IS 'Sexo do funcionário (MASCULINO, FEMININO, OUTRO)';
COMMENT ON COLUMN employees.matricula_esocial IS 'Matrícula do funcionário no eSocial (opcional)';
