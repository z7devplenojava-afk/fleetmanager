-- Tabela para armazenar templates faciais dos funcionários
CREATE TABLE IF NOT EXISTS employee_faces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    face_template BYTEA NOT NULL, -- Template facial binário do SeetaFace2
    face_encoding TEXT, -- Encoding base64 para backup
    face_quality_score DECIMAL(5,2), -- Qualidade da face (0-100)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    
    CONSTRAINT fk_employee_faces_employee 
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT uk_employee_faces_cpf UNIQUE (cpf),
    CONSTRAINT uk_employee_faces_employee UNIQUE (employee_id)
);

-- Tabela para logs de reconhecimento facial
CREATE TABLE IF NOT EXISTS facial_recognition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID,
    cpf VARCHAR(14),
    recognition_type VARCHAR(50) NOT NULL, -- 'LOGIN', 'VISIT', 'ATTENDANCE'
    confidence_score DECIMAL(5,2), -- Score de confiança (0-100)
    face_quality_score DECIMAL(5,2), -- Qualidade da face capturada
    recognition_status VARCHAR(20) NOT NULL, -- 'SUCCESS', 'FAILED', 'LOW_CONFIDENCE'
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_facial_logs_employee 
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- Tabela para configurações do SeetaFace2
CREATE TABLE IF NOT EXISTS facial_recognition_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir configurações padrão do SeetaFace2
INSERT INTO facial_recognition_config (config_key, config_value, description) VALUES
('min_confidence_threshold', '75.0', 'Score mínimo de confiança para reconhecimento (0-100)'),
('min_face_quality', '60.0', 'Qualidade mínima da face para aceitar (0-100)'),
('max_faces_per_employee', '3', 'Número máximo de templates por funcionário'),
('face_detection_model', 'seetaface2_detector', 'Modelo de detecção de faces'),
('face_recognition_model', 'seetaface2_recognizer', 'Modelo de reconhecimento facial'),
('face_landmark_model', 'seetaface2_landmarker', 'Modelo de landmarks faciais'),
('enable_liveness_detection', 'true', 'Habilitar detecção de vivacidade'),
('liveness_threshold', '80.0', 'Threshold para detecção de vivacidade'),
('max_recognition_attempts', '3', 'Máximo de tentativas de reconhecimento'),
('lockout_duration_minutes', '15', 'Duração do bloqueio após falhas (minutos)')
ON CONFLICT (config_key) DO NOTHING;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_employee_faces_cpf ON employee_faces(cpf);
CREATE INDEX IF NOT EXISTS idx_employee_faces_employee_id ON employee_faces(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_faces_active ON employee_faces(is_active);

CREATE INDEX IF NOT EXISTS idx_facial_logs_employee_id ON facial_recognition_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_facial_logs_cpf ON facial_recognition_logs(cpf);
CREATE INDEX IF NOT EXISTS idx_facial_logs_type ON facial_recognition_logs(recognition_type);
CREATE INDEX IF NOT EXISTS idx_facial_logs_status ON facial_recognition_logs(recognition_status);
CREATE INDEX IF NOT EXISTS idx_facial_logs_created_at ON facial_recognition_logs(created_at);

-- Comentários nas tabelas
COMMENT ON TABLE employee_faces IS 'Armazena templates faciais dos funcionários para reconhecimento';
COMMENT ON TABLE facial_recognition_logs IS 'Logs de tentativas de reconhecimento facial';
COMMENT ON TABLE facial_recognition_config IS 'Configurações do sistema de reconhecimento facial';

-- Comentários nas colunas principais
COMMENT ON COLUMN employee_faces.face_template IS 'Template facial binário gerado pelo SeetaFace2';
COMMENT ON COLUMN employee_faces.face_quality_score IS 'Score de qualidade da face (0-100)';
COMMENT ON COLUMN facial_recognition_logs.confidence_score IS 'Score de confiança do reconhecimento (0-100)';
COMMENT ON COLUMN facial_recognition_logs.recognition_status IS 'Status do reconhecimento: SUCCESS, FAILED, LOW_CONFIDENCE';
