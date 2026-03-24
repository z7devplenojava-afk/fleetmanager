-- Adicionar campo work_post_id na tabela vehicles
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS work_post_id UUID;

-- Adicionar constraint de chave estrangeira (se existir tabela work_posts)
-- ALTER TABLE vehicles
-- ADD CONSTRAINT fk_vehicles_work_post
-- FOREIGN KEY (work_post_id) REFERENCES work_posts(id) ON DELETE SET NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_vehicles_work_post_id ON vehicles(work_post_id);

-- Comentário para documentação
COMMENT ON COLUMN vehicles.work_post_id IS 'ID do posto de trabalho associado ao veículo (opcional)';
