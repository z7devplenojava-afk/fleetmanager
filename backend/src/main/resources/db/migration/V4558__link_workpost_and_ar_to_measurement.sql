-- =============================================================================
-- V4555__link_workpost_and_ar_to_measurement.sql
-- Descrição: Associa Obra/Setor de Trabalho (work_posts) e Contas a Receber
--            aos Boletins de Medição, além de incluir campos de observações
--            e tabelas de suporte às seções da medição.
-- =============================================================================

-- 1. Adiciona coluna work_post_id na tabela measurement_bulletins
ALTER TABLE measurement_bulletins
    ADD COLUMN IF NOT EXISTS work_post_id UUID REFERENCES work_posts(id);

CREATE INDEX IF NOT EXISTS idx_measurement_bulletins_work_post
    ON measurement_bulletins(work_post_id);

-- 2. Adiciona coluna measurement_id na tabela accounts_receivable
ALTER TABLE accounts_receivable
    ADD COLUMN IF NOT EXISTS measurement_id UUID REFERENCES measurement_bulletins(id);

CREATE INDEX IF NOT EXISTS idx_accounts_receivable_measurement
    ON accounts_receivable(measurement_id);

-- 3. Adiciona campo observations em measurement_items
ALTER TABLE measurement_items
    ADD COLUMN IF NOT EXISTS observations VARCHAR(500);
