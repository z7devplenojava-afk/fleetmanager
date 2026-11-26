-- V4727: Adicionar campos de quantidade de pecas e valor nos itens de checklist da OS
ALTER TABLE ordem_servico_checklist
    ADD COLUMN IF NOT EXISTS quantidade_pecas NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS valor_peca NUMERIC(12,2);
