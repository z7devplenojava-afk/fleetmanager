-- ====================================
-- PRD: FECHAMENTO MENSAL DE HORAS
-- Fase 1: Fundação - Tabelas Base
-- ====================================

-- Tabela: ponto_raw (batidas brutas importadas do REP)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ponto_raw') THEN
        CREATE TABLE ponto_raw (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            timestamp TIMESTAMP NOT NULL,
            tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA')),
            import_hash VARCHAR(64) NOT NULL, -- SHA-256 do conteúdo original para idempotência
            import_job_id UUID, -- Referência ao job de importação
            raw_data JSONB, -- Dados originais do REP preservados
            processed BOOLEAN DEFAULT false, -- Indica se já foi processado
            processed_at TIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            
            -- Índices para performance
            CONSTRAINT unique_employee_timestamp_type UNIQUE (employee_id, timestamp, tipo)
        );
        
        CREATE INDEX idx_ponto_raw_employee_id ON ponto_raw(employee_id);
        CREATE INDEX idx_ponto_raw_timestamp ON ponto_raw(timestamp);
        CREATE INDEX idx_ponto_raw_import_job_id ON ponto_raw(import_job_id);
        CREATE INDEX idx_ponto_raw_import_hash ON ponto_raw(import_hash);
        CREATE INDEX idx_ponto_raw_processed ON ponto_raw(processed);
        CREATE INDEX idx_ponto_raw_employee_date ON ponto_raw(employee_id, DATE(timestamp));
        
        COMMENT ON TABLE ponto_raw IS 'Batidas brutas importadas do REP (Registro Eletrônico de Ponto)';
        COMMENT ON COLUMN ponto_raw.import_hash IS 'Hash SHA-256 do conteúdo original para garantir idempotência na importação';
        COMMENT ON COLUMN ponto_raw.raw_data IS 'Dados originais do REP preservados em formato JSON';
        COMMENT ON COLUMN ponto_raw.processed IS 'Indica se a batida já foi processada e convertida em TimeRecord';
    END IF;
END $$;

-- Tabela: import_job_log (log de importações de batidas)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'import_job_log') THEN
        CREATE TABLE import_job_log (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            import_hash VARCHAR(64) UNIQUE NOT NULL, -- Hash único para identificar a importação
            file_name VARCHAR(255),
            file_size BIGINT,
            total_records INTEGER DEFAULT 0,
            processed_records INTEGER DEFAULT 0,
            failed_records INTEGER DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),
            error_message TEXT,
            error_details JSONB, -- Detalhes dos erros (ex: linha, campo, valor)
            imported_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
            imported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            
            -- Metadados adicionais
            source_type VARCHAR(50), -- FILE, API, MANUAL
            source_info JSONB -- Informações sobre a origem (ex: endpoint, formato)
        );
        
        CREATE INDEX idx_import_job_log_import_hash ON import_job_log(import_hash);
        CREATE INDEX idx_import_job_log_status ON import_job_log(status);
        CREATE INDEX idx_import_job_log_imported_by_id ON import_job_log(imported_by_id);
        CREATE INDEX idx_import_job_log_imported_at ON import_job_log(imported_at);
        
        COMMENT ON TABLE import_job_log IS 'Log de importações de batidas do REP para auditoria e rastreabilidade';
        COMMENT ON COLUMN import_job_log.import_hash IS 'Hash único da importação usado para prevenir duplicações';
        COMMENT ON COLUMN import_job_log.status IS 'Status da importação: PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED';
    END IF;
END $$;

-- Tabela: holidays (feriados para cálculos de adicional)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'holidays') THEN
        CREATE TABLE holidays (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            date DATE NOT NULL,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(50) NOT NULL CHECK (type IN ('NATIONAL', 'STATE', 'MUNICIPAL', 'CONVENTION')),
            is_optional BOOLEAN DEFAULT false,
            description TEXT,
            state_code VARCHAR(2), -- Para feriados estaduais
            city_name VARCHAR(100), -- Para feriados municipais
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            -- Garantir que não haja duplicatas
            CONSTRAINT unique_holiday_date_name UNIQUE (date, name)
        );
        
        CREATE INDEX idx_holidays_date ON holidays(date);
        CREATE INDEX idx_holidays_type ON holidays(type);
        CREATE INDEX idx_holidays_year ON holidays(EXTRACT(YEAR FROM date));
        
        COMMENT ON TABLE holidays IS 'Feriados nacionais, estaduais, municipais e convencionais para cálculos de adicional';
        COMMENT ON COLUMN holidays.type IS 'Tipo de feriado: NATIONAL, STATE, MUNICIPAL, CONVENTION';
        COMMENT ON COLUMN holidays.is_optional IS 'Indica se é feriado opcional (ex: ponto facultativo)';
    END IF;
END $$;

-- Adicionar referência de import_job_id na ponto_raw para import_job_log
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_ponto_raw_import_job_log'
    ) THEN
        ALTER TABLE ponto_raw 
        ADD CONSTRAINT fk_ponto_raw_import_job_log 
        FOREIGN KEY (import_job_id) REFERENCES import_job_log(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Trigger para atualizar updated_at em holidays
CREATE OR REPLACE FUNCTION update_holidays_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'holidays_updated_at_trigger'
    ) THEN
        CREATE TRIGGER holidays_updated_at_trigger
        BEFORE UPDATE ON holidays
        FOR EACH ROW
        EXECUTE FUNCTION update_holidays_updated_at();
    END IF;
END $$;

-- Inserir feriados nacionais brasileiros para o ano atual e próximos anos
-- (Usuário pode adicionar mais através da UI)
DO $$
DECLARE
    current_year INT;
    next_year INT;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    next_year := current_year + 1;
    
    -- Feriados fixos (mesmo dia todos os anos)
    INSERT INTO holidays (date, name, type, is_optional, description) VALUES
    -- Ano atual
    (DATE(current_year || '-01-01'), 'Confraternização Universal', 'NATIONAL', false, 'Ano Novo'),
    (DATE(current_year || '-04-21'), 'Tiradentes', 'NATIONAL', false, 'Dia de Tiradentes'),
    (DATE(current_year || '-05-01'), 'Dia do Trabalhador', 'NATIONAL', false, 'Dia do Trabalho'),
    (DATE(current_year || '-09-07'), 'Independência do Brasil', 'NATIONAL', false, 'Dia da Independência'),
    (DATE(current_year || '-10-12'), 'Nossa Senhora Aparecida', 'NATIONAL', false, 'Padroeira do Brasil'),
    (DATE(current_year || '-11-02'), 'Finados', 'NATIONAL', false, 'Dia de Finados'),
    (DATE(current_year || '-11-15'), 'Proclamação da República', 'NATIONAL', false, 'Proclamação da República'),
    (DATE(current_year || '-12-25'), 'Natal', 'NATIONAL', false, 'Natal'),
    
    -- Próximo ano
    (DATE(next_year || '-01-01'), 'Confraternização Universal', 'NATIONAL', false, 'Ano Novo'),
    (DATE(next_year || '-04-21'), 'Tiradentes', 'NATIONAL', false, 'Dia de Tiradentes'),
    (DATE(next_year || '-05-01'), 'Dia do Trabalhador', 'NATIONAL', false, 'Dia do Trabalho'),
    (DATE(next_year || '-09-07'), 'Independência do Brasil', 'NATIONAL', false, 'Dia da Independência'),
    (DATE(next_year || '-10-12'), 'Nossa Senhora Aparecida', 'NATIONAL', false, 'Padroeira do Brasil'),
    (DATE(next_year || '-11-02'), 'Finados', 'NATIONAL', false, 'Dia de Finados'),
    (DATE(next_year || '-11-15'), 'Proclamação da República', 'NATIONAL', false, 'Proclamação da República'),
    (DATE(next_year || '-12-25'), 'Natal', 'NATIONAL', false, 'Natal')
    ON CONFLICT (date, name) DO NOTHING;
    
    -- Feriados móveis (calculados dinamicamente - Carnaval, Páscoa, etc.)
    -- Nota: Para implementação completa, seria necessário calcular dinamicamente
    -- Por enquanto, o usuário deve inserir manualmente via UI
    
END $$;

-- Adicionar permissões
INSERT INTO permissions (id, name, description) VALUES
(gen_random_uuid(), 'PONTO_RAW_READ', 'Visualizar batidas brutas importadas'),
(gen_random_uuid(), 'PONTO_RAW_IMPORT', 'Importar batidas brutas do REP'),
(gen_random_uuid(), 'PONTO_RAW_DELETE', 'Excluir batidas brutas importadas'),
(gen_random_uuid(), 'HOLIDAY_READ', 'Visualizar feriados'),
(gen_random_uuid(), 'HOLIDAY_CREATE', 'Criar feriados'),
(gen_random_uuid(), 'HOLIDAY_UPDATE', 'Editar feriados'),
(gen_random_uuid(), 'HOLIDAY_DELETE', 'Excluir feriados')
ON CONFLICT (name) DO NOTHING;





