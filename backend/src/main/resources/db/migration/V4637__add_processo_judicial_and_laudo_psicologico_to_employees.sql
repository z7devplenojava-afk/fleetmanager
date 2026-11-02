-- =====================================================
-- Migration V4637: Campos para Histórico de Processo Judicial (RF07) e Laudo Psicológico
-- =====================================================

ALTER TABLE employees
ADD COLUMN IF NOT EXISTS processo_judicial_possui BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS processo_judicial_numero VARCHAR(100),
ADD COLUMN IF NOT EXISTS processo_judicial_vara VARCHAR(150),
ADD COLUMN IF NOT EXISTS processo_judicial_tipo_acao VARCHAR(100),
ADD COLUMN IF NOT EXISTS processo_judicial_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS processo_judicial_data_distribuicao DATE,
ADD COLUMN IF NOT EXISTS processo_judicial_observacoes TEXT,
ADD COLUMN IF NOT EXISTS laudo_psicologico_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS laudo_psicologico_profissional VARCHAR(150),
ADD COLUMN IF NOT EXISTS laudo_psicologico_observacoes TEXT;
