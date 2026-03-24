-- Criação da tabela de logs de atividade de usuários
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY,
    user_id UUID,
    username VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50),
    details TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    session_id VARCHAR(100),
    status VARCHAR(20),
    execution_time_ms BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Índices para melhorar performance das consultas (apenas se não existirem e se as colunas existirem)
DO $$
BEGIN
    -- Verificar se a coluna user_id existe antes de criar o índice
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_activity_logs' AND column_name = 'user_id') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_activity_logs_user_id') THEN
            CREATE INDEX idx_user_activity_logs_user_id ON user_activity_logs(user_id);
        END IF;
    END IF;
    
    -- Verificar se a coluna username existe antes de criar o índice
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_activity_logs' AND column_name = 'username') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_activity_logs_username') THEN
            CREATE INDEX idx_user_activity_logs_username ON user_activity_logs(username);
        END IF;
    END IF;
    
    -- Verificar se a coluna action existe antes de criar o índice
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_activity_logs' AND column_name = 'action') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_activity_logs_action') THEN
            CREATE INDEX idx_user_activity_logs_action ON user_activity_logs(action);
        END IF;
    END IF;
    
    -- Verificar se a coluna module existe antes de criar o índice
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_activity_logs' AND column_name = 'module') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_activity_logs_module') THEN
            CREATE INDEX idx_user_activity_logs_module ON user_activity_logs(module);
        END IF;
    END IF;
    
    -- Verificar se a coluna status existe antes de criar o índice
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_activity_logs' AND column_name = 'status') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_activity_logs_status') THEN
            CREATE INDEX idx_user_activity_logs_status ON user_activity_logs(status);
        END IF;
    END IF;
    
    -- Verificar se a coluna created_at existe antes de criar o índice
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_activity_logs' AND column_name = 'created_at') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_activity_logs_created_at') THEN
            CREATE INDEX idx_user_activity_logs_created_at ON user_activity_logs(created_at);
        END IF;
    END IF;
    
    -- Verificar se a coluna ip_address existe antes de criar o índice
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_activity_logs' AND column_name = 'ip_address') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_activity_logs_ip_address') THEN
            CREATE INDEX idx_user_activity_logs_ip_address ON user_activity_logs(ip_address);
        END IF;
    END IF;
    
    -- Verificar se a coluna session_id existe antes de criar o índice
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_activity_logs' AND column_name = 'session_id') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_activity_logs_session_id') THEN
            CREATE INDEX idx_user_activity_logs_session_id ON user_activity_logs(session_id);
        END IF;
    END IF;
    
    -- Verificar se as colunas user_id e created_at existem antes de criar o índice composto
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_activity_logs' AND column_name = 'user_id') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_activity_logs' AND column_name = 'created_at') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_activity_logs_user_period') THEN
            CREATE INDEX idx_user_activity_logs_user_period ON user_activity_logs(user_id, created_at);
        END IF;
    END IF;
    
    -- Verificar se as colunas username e created_at existem antes de criar o índice composto
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_activity_logs' AND column_name = 'username') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_activity_logs' AND column_name = 'created_at') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_activity_logs_username_period') THEN
            CREATE INDEX idx_user_activity_logs_username_period ON user_activity_logs(username, created_at);
        END IF;
    END IF;
    
    -- Verificar se as colunas created_at e ended_at existem antes de criar o índice composto
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_activity_logs' AND column_name = 'created_at') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_activity_logs' AND column_name = 'ended_at') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_activity_logs_period') THEN
            CREATE INDEX idx_user_activity_logs_period ON user_activity_logs(created_at, ended_at);
        END IF;
    END IF;
END $$;
