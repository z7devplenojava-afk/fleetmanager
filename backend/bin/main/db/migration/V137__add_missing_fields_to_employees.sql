-- Adiciona campos faltantes na tabela employees para alinhar com a entidade Java
ALTER TABLE employees ADD COLUMN IF NOT EXISTS address VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS email VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS marital_status VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nationality VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS photo_url VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS current_scale VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS caminho_pdf VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS mes_referencia VARCHAR(10);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ano_referencia VARCHAR(10);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS document VARCHAR(14) UNIQUE;

-- Copiar dados do cpf para document se document estiver vazio
UPDATE employees SET document = cpf WHERE document IS NULL; 