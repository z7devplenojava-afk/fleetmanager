-- V4536__create_work_journey_configs_table.sql
-- Configurações de jornada de trabalho por empresa (multi-tenant)

CREATE TABLE IF NOT EXISTS work_journey_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    
    -- Carga horária diária padrão (em horas decimais, ex: 8.0)
    carga_horaria_diaria DECIMAL(5,2) NOT NULL DEFAULT 8.00,
    
    -- Tolerância para atraso (em minutos, ex: 10)
    tolerancia_atraso_min INT NOT NULL DEFAULT 10,
    
    -- Duração do intervalo intrajornada (em minutos, ex: 60)
    intervalo_min INT NOT NULL DEFAULT 60,
    
    -- Percentual de hora extra (ex: 50.00 = 50%)
    percentual_he_normal DECIMAL(5,2) NOT NULL DEFAULT 50.00,
    
    -- Percentual de hora extra noturna (ex: 60.00 = 60%)
    percentual_he_noturna DECIMAL(5,2) NOT NULL DEFAULT 60.00,
    
    -- Percentual de hora extra 100% (domingos e feriados)
    percentual_he_100 DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    
    -- Carga horária semanal máxima (em horas)
    carga_horaria_semanal DECIMAL(5,2) NOT NULL DEFAULT 44.00,
    
    -- Início da jornada noturna (hora, ex: 22)
    inicio_jornada_noturna INT NOT NULL DEFAULT 22,
    
    -- Fim da jornada noturna (hora, ex: 5)
    fim_jornada_noturna INT NOT NULL DEFAULT 5,
    
    -- Banco de horas ativo
    banco_horas_ativo BOOLEAN NOT NULL DEFAULT false,
    
    -- Validação de geolocalização obrigatória
    geo_obrigatoria BOOLEAN NOT NULL DEFAULT false,
    
    -- Raio de validação geográfica (metros)
    geo_raio_metros INT NOT NULL DEFAULT 100,
    
    -- Ativo
    ativo BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Garantir apenas uma config por empresa
    CONSTRAINT uq_work_journey_config_company UNIQUE (company_id)
);

-- Index para busca por empresa
CREATE INDEX idx_work_journey_configs_company_id ON work_journey_configs(company_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_work_journey_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_work_journey_configs_updated_at
    BEFORE UPDATE ON work_journey_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_work_journey_configs_updated_at();
