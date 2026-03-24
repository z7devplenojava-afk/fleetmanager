-- Criar tabela file_system_items
CREATE TABLE IF NOT EXISTS file_system_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    path VARCHAR(1000) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('FILE', 'FOLDER')),
    size BIGINT,
    mime_type VARCHAR(100),
    file_extension VARCHAR(10),
    parent_id UUID REFERENCES file_system_items(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    physical_path VARCHAR(1000)
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_file_system_items_parent_id ON file_system_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_file_system_items_owner_id ON file_system_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_file_system_items_path ON file_system_items(path);
CREATE INDEX IF NOT EXISTS idx_file_system_items_type ON file_system_items(type);
CREATE INDEX IF NOT EXISTS idx_file_system_items_is_deleted ON file_system_items(is_deleted);
CREATE INDEX IF NOT EXISTS idx_file_system_items_name ON file_system_items(name);

-- Criar índice composto para busca eficiente
CREATE INDEX IF NOT EXISTS idx_file_system_items_owner_parent_name ON file_system_items(owner_id, parent_id, name) WHERE is_deleted = FALSE;

-- Criar trigger para atualizar modified_at automaticamente
CREATE OR REPLACE FUNCTION update_file_system_items_modified_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_file_system_items_modified_at
    BEFORE UPDATE ON file_system_items
    FOR EACH ROW
    EXECUTE FUNCTION update_file_system_items_modified_at();

-- Comentários na tabela
COMMENT ON TABLE file_system_items IS 'Tabela para armazenar informações de arquivos e pastas do sistema de arquivos';
COMMENT ON COLUMN file_system_items.id IS 'Identificador único do item';
COMMENT ON COLUMN file_system_items.name IS 'Nome do arquivo ou pasta';
COMMENT ON COLUMN file_system_items.path IS 'Caminho do diretório pai';
COMMENT ON COLUMN file_system_items.type IS 'Tipo do item: FILE ou FOLDER';
COMMENT ON COLUMN file_system_items.size IS 'Tamanho do arquivo em bytes (NULL para pastas)';
COMMENT ON COLUMN file_system_items.mime_type IS 'Tipo MIME do arquivo';
COMMENT ON COLUMN file_system_items.file_extension IS 'Extensão do arquivo';
COMMENT ON COLUMN file_system_items.parent_id IS 'ID do diretório pai (NULL para raiz)';
COMMENT ON COLUMN file_system_items.owner_id IS 'ID do usuário proprietário';
COMMENT ON COLUMN file_system_items.is_deleted IS 'Flag para soft delete';
COMMENT ON COLUMN file_system_items.physical_path IS 'Caminho físico do arquivo no sistema';
