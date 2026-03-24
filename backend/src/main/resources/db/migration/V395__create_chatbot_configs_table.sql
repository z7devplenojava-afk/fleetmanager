-- Migration: Create chatbot_configs table
-- Description: Tabela para armazenar configurações do chatbot de atendimento

-- Verificar se a tabela users existe e tem PRIMARY KEY antes de criar
DO $$
BEGIN
    -- Verificar se a tabela users existe e tem PRIMARY KEY
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'users'
    ) AND EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'users' 
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
        -- Criar tabela se não existir
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chatbot_configs') THEN
            CREATE TABLE chatbot_configs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) NOT NULL,
                welcome_message TEXT,
                default_response TEXT,
                is_active BOOLEAN DEFAULT true,
                auto_respond BOOLEAN DEFAULT true,
                transfer_to_human_enabled BOOLEAN DEFAULT true,
                working_hours_enabled BOOLEAN DEFAULT false,
                working_hours_start VARCHAR(5), -- HH:mm format
                working_hours_end VARCHAR(5), -- HH:mm format
                offline_message TEXT,
                max_wait_time_minutes INTEGER DEFAULT 30,
                auto_escalate_enabled BOOLEAN DEFAULT false,
                auto_escalate_after_minutes INTEGER DEFAULT 15,
                knowledge_base_enabled BOOLEAN DEFAULT false,
                sentiment_analysis_enabled BOOLEAN DEFAULT false,
                language VARCHAR(10) DEFAULT 'pt-BR',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP,
                created_by UUID REFERENCES users(id),
                updated_by UUID REFERENCES users(id),
                CONSTRAINT unique_chatbot_name UNIQUE (name)
            );
            
            -- Criar índices para melhor performance
            CREATE INDEX idx_chatbot_configs_active ON chatbot_configs(is_active);
            CREATE INDEX idx_chatbot_configs_name ON chatbot_configs(name);
            CREATE INDEX idx_chatbot_configs_created_at ON chatbot_configs(created_at);
            
            -- Comentários nas colunas
            COMMENT ON TABLE chatbot_configs IS 'Configurações do chatbot de atendimento';
            COMMENT ON COLUMN chatbot_configs.name IS 'Nome da configuração do chatbot';
            COMMENT ON COLUMN chatbot_configs.welcome_message IS 'Mensagem de boas-vindas do chatbot';
            COMMENT ON COLUMN chatbot_configs.default_response IS 'Resposta padrão quando o chatbot não entende a mensagem';
            COMMENT ON COLUMN chatbot_configs.is_active IS 'Indica se esta configuração está ativa';
            COMMENT ON COLUMN chatbot_configs.auto_respond IS 'Se o chatbot deve responder automaticamente';
            COMMENT ON COLUMN chatbot_configs.transfer_to_human_enabled IS 'Se permite transferência para atendente humano';
            COMMENT ON COLUMN chatbot_configs.working_hours_enabled IS 'Se respeita horário de funcionamento';
            COMMENT ON COLUMN chatbot_configs.working_hours_start IS 'Horário de início do funcionamento (HH:mm)';
            COMMENT ON COLUMN chatbot_configs.working_hours_end IS 'Horário de fim do funcionamento (HH:mm)';
            COMMENT ON COLUMN chatbot_configs.offline_message IS 'Mensagem exibida fora do horário de funcionamento';
            COMMENT ON COLUMN chatbot_configs.max_wait_time_minutes IS 'Tempo máximo de espera antes de escalar';
            COMMENT ON COLUMN chatbot_configs.auto_escalate_enabled IS 'Se deve escalar automaticamente após tempo de espera';
            COMMENT ON COLUMN chatbot_configs.auto_escalate_after_minutes IS 'Tempo em minutos antes de escalar automaticamente';
            COMMENT ON COLUMN chatbot_configs.knowledge_base_enabled IS 'Se usa base de conhecimento para respostas';
            COMMENT ON COLUMN chatbot_configs.sentiment_analysis_enabled IS 'Se analisa sentimento das mensagens';
            COMMENT ON COLUMN chatbot_configs.language IS 'Idioma do chatbot (ex: pt-BR, en-US)';
        ELSE
            -- Se a tabela já existe, apenas criar índices que ainda não existem
            CREATE INDEX IF NOT EXISTS idx_chatbot_configs_active ON chatbot_configs(is_active);
            CREATE INDEX IF NOT EXISTS idx_chatbot_configs_name ON chatbot_configs(name);
            CREATE INDEX IF NOT EXISTS idx_chatbot_configs_created_at ON chatbot_configs(created_at);
        END IF;
    END IF;
END $$;

