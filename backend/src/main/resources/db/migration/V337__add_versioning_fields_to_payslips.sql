-- Migration para adicionar campos de versionamento e organização conforme PRD
-- Adiciona campos: versao, hash_conteudo, arquivo_caminho

-- Adicionar campo de versão
ALTER TABLE payslips 
ADD COLUMN IF NOT EXISTS versao INTEGER DEFAULT 1;

-- Adicionar campo de hash do conteúdo (SHA-256 = 64 caracteres hex)
ALTER TABLE payslips 
ADD COLUMN IF NOT EXISTS hash_conteudo VARCHAR(64);

-- Adicionar campo de caminho completo do arquivo
ALTER TABLE payslips 
ADD COLUMN IF NOT EXISTS arquivo_caminho VARCHAR(500);

-- Criar índices conforme PRD
CREATE INDEX IF NOT EXISTS idx_holerite_empresa ON payslips(company_cnpj);
CREATE INDEX IF NOT EXISTS idx_holerite_setor ON payslips(work_post_name);
CREATE INDEX IF NOT EXISTS idx_holerite_periodo ON payslips(year, month);
CREATE INDEX IF NOT EXISTS idx_holerite_funcionario ON payslips(cpf);

-- Índice composto para busca por empresa, setor, período e funcionário (usado no versionamento)
CREATE INDEX IF NOT EXISTS idx_holerite_versionamento 
ON payslips(company_cnpj, work_post_name, year, month, cpf, versao);

-- Comentários nas colunas para documentação
COMMENT ON COLUMN payslips.versao IS 'Versão sequencial do holerite (v1, v2, v3, ...)';
COMMENT ON COLUMN payslips.hash_conteudo IS 'Hash SHA-256 do conteúdo do PDF para detecção de alterações';
COMMENT ON COLUMN payslips.arquivo_caminho IS 'Caminho completo do arquivo: empresa-cnpj/setor/ano-mes/funcionario-cpf/holerite_vN.pdf';

