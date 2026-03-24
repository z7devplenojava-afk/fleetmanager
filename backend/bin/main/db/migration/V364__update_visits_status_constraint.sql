-- Atualizar constraint de status para incluir os novos valores
ALTER TABLE visits 
DROP CONSTRAINT IF EXISTS chk_visits_status;

-- Adicionar nova constraint com todos os valores de status
ALTER TABLE visits 
ADD CONSTRAINT chk_visits_status CHECK (status IN (
    'SCHEDULED',      -- Agendada
    'IN_PROGRESS',    -- Em Andamento
    'COMPLETED',      -- Concluída
    'CANCELLED',      -- Cancelada
    'PENDING',        -- Pendente (mantido para compatibilidade)
    'NOT_COMPLETED'   -- Não Realizada (mantido para compatibilidade)
));

-- Comentário na constraint
COMMENT ON CONSTRAINT chk_visits_status ON visits IS 'Valida os valores permitidos para o status da visita';

