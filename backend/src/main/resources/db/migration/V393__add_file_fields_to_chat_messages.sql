-- Adicionar campos de arquivo na tabela chat_messages
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS file_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS file_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS file_content_type VARCHAR(100);

-- Criar índice para busca por arquivos
CREATE INDEX IF NOT EXISTS idx_chat_messages_file_url ON chat_messages(file_url);

-- Comentários
COMMENT ON COLUMN chat_messages.file_url IS 'URL do arquivo anexado (imagem, áudio, vídeo, documento)';
COMMENT ON COLUMN chat_messages.file_name IS 'Nome original do arquivo';
COMMENT ON COLUMN chat_messages.file_size IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN chat_messages.file_content_type IS 'Tipo MIME do arquivo (ex: image/jpeg, audio/mpeg, application/pdf)';

