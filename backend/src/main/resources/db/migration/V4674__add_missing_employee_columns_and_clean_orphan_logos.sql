-- ====================================================================
-- V4674: Sincronizar colunas da entidade Employee e limpar logos órfãs
-- ====================================================================

-- Colunas da Ficha de Empregado e dados complementares
ALTER TABLE employees ADD COLUMN IF NOT EXISTS conta_corrente_digito VARCHAR(10);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS numero_portaria VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS data_portaria DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS fgts_conta VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS casado_brasileiro BOOLEAN;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nome_conjuge_estrangeiro VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ric_numero VARCHAR(30);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ric_orgao_emissor VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ric_data_emissao DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS tipo_visto VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS spouse_name VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS spouse_cpf VARCHAR(14);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS spouse_rg VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS spouse_birth_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS spouse_phone VARCHAR(20);

-- Limpar logos órfãs de arquivos inexistentes no disco
UPDATE companies 
SET logo_url = NULL 
WHERE logo_url LIKE '%e9654118-53a8-4dd8-b57c-bc50997f081b.jpg%';
