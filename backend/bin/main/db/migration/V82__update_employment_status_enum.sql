-- Atualizar registros existentes que usam 'ON_LEAVE' para 'VACATION'
-- Como o campo status é VARCHAR(20) e não um enum PostgreSQL, 
-- não precisamos alterar o tipo, apenas atualizar os valores existentes

UPDATE employees SET status = 'VACATION' WHERE status = 'ON_LEAVE';

-- Adicionar comentário sobre os valores válidos para o campo status
COMMENT ON COLUMN employees.status IS 'Valores válidos: ACTIVE, INACTIVE, VACATION, MATERNITY_LEAVE, MEDICAL_CERTIFICATE, TERMINATED, SUSPENDED';

-- Remover o valor antigo 'ON_LEAVE' do enum (opcional, pode ser feito em uma migration futura)
-- ALTER TYPE employment_status DROP VALUE 'ON_LEAVE'; 