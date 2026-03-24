-- Migration para atualizar a constraint de tipo de remanejamento no histórico
-- Adiciona os valores faltantes do enum RemanejamentoTipo

-- Remover a constraint antiga
ALTER TABLE remanejamentos_historico 
    DROP CONSTRAINT IF EXISTS chk_remanejamentos_historico_tipo;

-- Recriar a constraint com todos os valores do enum
ALTER TABLE remanejamentos_historico 
    ADD CONSTRAINT chk_remanejamentos_historico_tipo 
    CHECK (tipo IN (
        'TRANSFERENCIA_UNIDADE',
        'TRANSFERENCIA_POSTO_TRABALHO',
        'TROCA_FUNCAO',
        'PROMOCAO',
        'COBRIR_FERIAS',
        'COBRIR_FALTA',
        'PLANTAO',
        'OUTROS'
    ));

-- Atualizar o comentário da coluna
COMMENT ON COLUMN remanejamentos_historico.tipo IS 'Tipo do remanejamento (TRANSFERENCIA_UNIDADE, TRANSFERENCIA_POSTO_TRABALHO, TROCA_FUNCAO, PROMOCAO, COBRIR_FERIAS, COBRIR_FALTA, PLANTAO, OUTROS)';












