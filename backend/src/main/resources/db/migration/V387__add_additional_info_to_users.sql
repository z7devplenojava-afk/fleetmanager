-- Adicionar campos de informações adicionais à tabela users
-- Estes campos são opcionais e permitem armazenar informações complementares dos usuários

-- Avatar/Photo URL
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(500);

-- Departamento
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- Cargo/Posição
ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(100);

-- Código do Funcionário
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_code VARCHAR(50);

-- Telefone
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Endereço
ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(500);

-- Comentários
COMMENT ON COLUMN users.avatar IS 'URL ou caminho para foto/avatar do usuário';
COMMENT ON COLUMN users.department IS 'Departamento onde o usuário trabalha';
COMMENT ON COLUMN users.position IS 'Cargo/posição do usuário na empresa';
COMMENT ON COLUMN users.employee_code IS 'Código identificador do funcionário';
COMMENT ON COLUMN users.phone IS 'Número de telefone de contato';
COMMENT ON COLUMN users.address IS 'Endereço residencial ou profissional';
