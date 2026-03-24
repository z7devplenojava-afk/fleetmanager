-- Corrige os nomes das colunas na tabela unified_documents
-- A entidade Java mapeia para file_name e file_path, mas a tabela foi criada com unified_file_name e unified_file_path

-- Renomear unified_file_name para file_name
ALTER TABLE unified_documents 
    RENAME COLUMN unified_file_name TO file_name;

-- Renomear unified_file_path para file_path
ALTER TABLE unified_documents 
    RENAME COLUMN unified_file_path TO file_path;

-- Comentários para documentação
COMMENT ON COLUMN unified_documents.file_name IS 'Nome do arquivo unificado';
COMMENT ON COLUMN unified_documents.file_path IS 'Caminho completo do arquivo unificado';

