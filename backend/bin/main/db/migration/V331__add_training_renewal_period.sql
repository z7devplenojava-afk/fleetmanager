-- V331: Adiciona campos de periodicidade e obrigatoriedade para treinamentos

ALTER TABLE trainings
    ADD COLUMN IF NOT EXISTS renewal_period_months INTEGER DEFAULT 12,
    ADD COLUMN IF NOT EXISTS mandatory_for_guards BOOLEAN DEFAULT TRUE;

UPDATE trainings
SET
    renewal_period_months = COALESCE(renewal_period_months, 12),
    mandatory_for_guards = COALESCE(mandatory_for_guards, TRUE);

ALTER TABLE trainings
    ALTER COLUMN renewal_period_months SET NOT NULL,
    ALTER COLUMN mandatory_for_guards SET NOT NULL;

COMMENT ON COLUMN trainings.renewal_period_months IS 'Periodicidade (em meses) para renovação do treinamento';
COMMENT ON COLUMN trainings.mandatory_for_guards IS 'Indica se o treinamento é obrigatório para vigilantes';

