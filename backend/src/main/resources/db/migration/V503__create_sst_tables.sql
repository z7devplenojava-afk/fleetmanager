-- =====================================================
-- MIGRAÇÃO V503: CRIAÇÃO DAS TABELAS DO MÓDULO SST
-- (Saúde e Segurança do Trabalho)
-- =====================================================

-- 1. Tabela de Tipos de Risco Ocupacional
CREATE TABLE IF NOT EXISTS occupational_risk_types (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- FISICO, QUIMICO, BIOLOGICO, ERGONOMICO, ACIDENTE
    severity_level INTEGER NOT NULL DEFAULT 1, -- 1=Baixo, 2=Médio, 3=Alto, 4=Crítico
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Riscos por Cargo/Posição
CREATE TABLE IF NOT EXISTS position_risks (
    id UUID PRIMARY KEY,
    position_id UUID NOT NULL,
    risk_type_id UUID NOT NULL,
    risk_level VARCHAR(20) NOT NULL, -- BAIXO, MEDIO, ALTO, CRITICO
    description TEXT,
    preventive_measures TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE,
    FOREIGN KEY (risk_type_id) REFERENCES occupational_risk_types(id) ON DELETE CASCADE,
    UNIQUE(position_id, risk_type_id)
);

-- 3. Tabela de Riscos por Funcionário (exceções/ajustes)
CREATE TABLE IF NOT EXISTS employee_risks (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL,
    risk_type_id UUID NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    description TEXT,
    preventive_measures TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (risk_type_id) REFERENCES occupational_risk_types(id) ON DELETE CASCADE,
    UNIQUE(employee_id, risk_type_id)
);

-- 4. Tabela de EPIs (Equipamentos de Proteção Individual)
CREATE TABLE IF NOT EXISTS personal_protective_equipment (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- CABECA, OLHOS, AUDITIVO, RESPIRATORIO, MAOS, PES, CORPO
    ca_number VARCHAR(50), -- Número do CA (Certificado de Aprovação)
    ca_validity DATE,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    unit_of_measurement VARCHAR(20) NOT NULL DEFAULT 'UNIDADE', -- UNIDADE, PAR, METRO, etc.
    minimum_stock INTEGER NOT NULL DEFAULT 0,
    current_stock INTEGER NOT NULL DEFAULT 0,
    unit_cost DECIMAL(10,2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabela de EPIs por Risco (matriz de obrigatoriedade)
CREATE TABLE IF NOT EXISTS risk_required_epis (
    id UUID PRIMARY KEY,
    risk_type_id UUID NOT NULL,
    epi_id UUID NOT NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT true,
    quantity INTEGER NOT NULL DEFAULT 1,
    replacement_frequency_days INTEGER, -- Frequência de reposição em dias
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (risk_type_id) REFERENCES occupational_risk_types(id) ON DELETE CASCADE,
    FOREIGN KEY (epi_id) REFERENCES personal_protective_equipment(id) ON DELETE CASCADE,
    UNIQUE(risk_type_id, epi_id)
);

-- 6. Tabela de Controle de Entrega de EPIs
CREATE TABLE IF NOT EXISTS epi_deliveries (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL,
    epi_id UUID NOT NULL,
    delivery_date DATE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    delivery_reason VARCHAR(50) NOT NULL, -- ADMISSAO, REPOSICAO, TROCA, PERDA, DANO
    delivered_by_user_id UUID,
    received_by_employee BOOLEAN NOT NULL DEFAULT false,
    employee_signature_url VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (epi_id) REFERENCES personal_protective_equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (delivered_by_user_id) REFERENCES users(id)
);

-- 7. Tabela de Tipos de Exames Médicos
CREATE TABLE IF NOT EXISTS medical_exam_types (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    exam_category VARCHAR(50) NOT NULL, -- ADMISSIONAL, PERIODICO, RETORNO, MUDANCA_FUNCAO, DEMISSIONAL
    validity_months INTEGER, -- Validade em meses (null = sem validade)
    is_mandatory BOOLEAN NOT NULL DEFAULT true,
    required_for_risks TEXT[], -- Array de IDs de riscos que exigem este exame
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabela de Controle de Exames Médicos (ASO)
CREATE TABLE IF NOT EXISTS medical_exams (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL,
    exam_type_id UUID NOT NULL,
    scheduled_date DATE,
    exam_date DATE,
    doctor_name VARCHAR(100),
    doctor_crm VARCHAR(20),
    clinic_name VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE', -- PENDENTE, REALIZADO, ATRASADO, CANCELADO
    result VARCHAR(20), -- APTO, INAPTO, APTO_COM_RESTRICOES
    restrictions TEXT,
    document_url VARCHAR(255), -- URL do ASO digitalizado
    next_exam_date DATE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_type_id) REFERENCES medical_exam_types(id) ON DELETE CASCADE
);

-- 9. Tabela de Treinamentos em SST
CREATE TABLE IF NOT EXISTS sst_trainings (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    training_type VARCHAR(50) NOT NULL, -- NR_35, CIPA, NR_10, BRIGADA_INCENDIO, etc.
    duration_hours INTEGER NOT NULL,
    validity_months INTEGER, -- Validade em meses (null = sem validade)
    is_mandatory BOOLEAN NOT NULL DEFAULT true,
    required_for_risks TEXT[], -- Array de IDs de riscos que exigem este treinamento
    provider VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Tabela de Participação em Treinamentos
CREATE TABLE IF NOT EXISTS training_participations (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL,
    training_id UUID NOT NULL,
    participation_date DATE NOT NULL,
    completion_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'AGENDADO', -- AGENDADO, EM_ANDAMENTO, CONCLUIDO, REPROVADO, CANCELADO
    score DECIMAL(5,2), -- Nota obtida (se aplicável)
    certificate_number VARCHAR(50),
    certificate_url VARCHAR(255), -- URL do certificado digitalizado
    instructor_name VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (training_id) REFERENCES sst_trainings(id) ON DELETE CASCADE
);

-- 11. Tabela de Registro de Acidentes
CREATE TABLE IF NOT EXISTS accident_records (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL,
    accident_date DATE NOT NULL,
    accident_time TIME,
    location VARCHAR(255) NOT NULL,
    accident_type VARCHAR(50) NOT NULL, -- COM_AFASTAMENTO, SEM_AFASTAMENTO, MORTAL, TRAJETO
    description TEXT NOT NULL,
    injury_description TEXT,
    body_parts_affected TEXT[], -- Array de partes do corpo afetadas
    immediate_causes TEXT,
    root_causes TEXT,
    corrective_actions TEXT,
    preventive_actions TEXT,
    cat_number VARCHAR(50), -- Número da CAT (Comunicação de Acidente de Trabalho)
    cat_issued_date DATE,
    days_off INTEGER DEFAULT 0,
    return_to_work_date DATE,
    witness_names TEXT,
    reported_by_user_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'REGISTRADO', -- REGISTRADO, INVESTIGADO, ENCERRADO
    photos_urls TEXT[], -- Array de URLs das fotos
    documents_urls TEXT[], -- Array de URLs dos documentos
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by_user_id) REFERENCES users(id)
);

-- 12. Tabela de Quase-Acidentes
CREATE TABLE IF NOT EXISTS near_miss_records (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL,
    incident_date DATE NOT NULL,
    incident_time TIME,
    location VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    potential_consequences TEXT,
    immediate_causes TEXT,
    root_causes TEXT,
    corrective_actions TEXT,
    preventive_actions TEXT,
    reported_by_user_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'REGISTRADO', -- REGISTRADO, INVESTIGADO, ENCERRADO
    photos_urls TEXT[],
    documents_urls TEXT[],
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by_user_id) REFERENCES users(id)
);

-- 13. Tabela de Inspeções de Segurança
CREATE TABLE IF NOT EXISTS safety_inspections (
    id UUID PRIMARY KEY,
    inspection_date DATE NOT NULL,
    location VARCHAR(255) NOT NULL,
    inspector_user_id UUID NOT NULL,
    inspection_type VARCHAR(50) NOT NULL, -- ROTINEIRA, ESPECIAL, AUDITORIA
    status VARCHAR(20) NOT NULL DEFAULT 'AGENDADA', -- AGENDADA, EM_ANDAMENTO, CONCLUIDA, CANCELADA
    description TEXT,
    findings TEXT,
    recommendations TEXT,
    photos_urls TEXT[],
    documents_urls TEXT[],
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inspector_user_id) REFERENCES users(id)
);

-- 14. Tabela de Não Conformidades
CREATE TABLE IF NOT EXISTS non_conformities (
    id UUID PRIMARY KEY,
    inspection_id UUID,
    accident_id UUID,
    near_miss_id UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL, -- BAIXA, MEDIA, ALTA, CRITICA
    status VARCHAR(20) NOT NULL DEFAULT 'ABERTA', -- ABERTA, EM_ANALISE, EM_CORRECAO, CORRIGIDA, FECHADA
    responsible_user_id UUID,
    due_date DATE,
    corrective_action TEXT,
    preventive_action TEXT,
    correction_date DATE,
    verified_by_user_id UUID,
    verification_date DATE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inspection_id) REFERENCES safety_inspections(id) ON DELETE SET NULL,
    FOREIGN KEY (accident_id) REFERENCES accident_records(id) ON DELETE SET NULL,
    FOREIGN KEY (near_miss_id) REFERENCES near_miss_records(id) ON DELETE SET NULL,
    FOREIGN KEY (responsible_user_id) REFERENCES users(id),
    FOREIGN KEY (verified_by_user_id) REFERENCES users(id)
);

-- 15. Tabela de Membros da CIPA
CREATE TABLE IF NOT EXISTS cipa_members (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL,
    mandate_year INTEGER NOT NULL,
    position VARCHAR(50) NOT NULL, -- TITULAR, SUPLENTE
    function VARCHAR(100), -- PRESIDENTE, VICE_PRESIDENTE, SECRETARIO, MEMBRO
    election_date DATE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE(employee_id, mandate_year, position)
);

-- 16. Tabela de Reuniões da CIPA
CREATE TABLE IF NOT EXISTS cipa_meetings (
    id UUID PRIMARY KEY,
    meeting_date DATE NOT NULL,
    meeting_time TIME,
    location VARCHAR(255),
    meeting_type VARCHAR(50) NOT NULL DEFAULT 'ORDINARIA', -- ORDINARIA, EXTRAORDINARIA
    agenda TEXT,
    minutes TEXT,
    attendees TEXT[], -- Array de nomes dos participantes
    decisions TEXT,
    action_items TEXT,
    next_meeting_date DATE,
    documents_urls TEXT[],
    created_by_user_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AGENDADA', -- AGENDADA, REALIZADA, CANCELADA
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

-- 17. Tabela de Alertas SST
CREATE TABLE IF NOT EXISTS sst_alerts (
    id UUID PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL, -- EPI_VENCIMENTO, EXAME_VENCIMENTO, TREINAMENTO_VENCIMENTO, ACIDENTE, NAO_CONFORMIDADE
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    employee_id UUID,
    related_entity_type VARCHAR(50), -- EPI_DELIVERY, MEDICAL_EXAM, TRAINING_PARTICIPATION, etc.
    related_entity_id UUID,
    priority INTEGER NOT NULL DEFAULT 2, -- 1=Baixa, 2=Média, 3=Alta, 4=Crítica
    due_date DATE,
    is_read BOOLEAN NOT NULL DEFAULT false,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by_user_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by_user_id) REFERENCES users(id)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_position_risks_position_id ON position_risks(position_id);
CREATE INDEX IF NOT EXISTS idx_employee_risks_employee_id ON employee_risks(employee_id);
CREATE INDEX IF NOT EXISTS idx_epi_deliveries_employee_id ON epi_deliveries(employee_id);
CREATE INDEX IF NOT EXISTS idx_epi_deliveries_delivery_date ON epi_deliveries(delivery_date);
CREATE INDEX IF NOT EXISTS idx_medical_exams_employee_id ON medical_exams(employee_id);
CREATE INDEX IF NOT EXISTS idx_medical_exams_status ON medical_exams(status);
CREATE INDEX IF NOT EXISTS idx_medical_exams_exam_date ON medical_exams(exam_date);
CREATE INDEX IF NOT EXISTS idx_training_participations_employee_id ON training_participations(employee_id);
CREATE INDEX IF NOT EXISTS idx_training_participations_status ON training_participations(status);
CREATE INDEX IF NOT EXISTS idx_accident_records_employee_id ON accident_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_accident_records_accident_date ON accident_records(accident_date);
CREATE INDEX IF NOT EXISTS idx_near_miss_records_employee_id ON near_miss_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_near_miss_records_incident_date ON near_miss_records(incident_date);
CREATE INDEX IF NOT EXISTS idx_safety_inspections_inspector_id ON safety_inspections(inspector_user_id);
CREATE INDEX IF NOT EXISTS idx_safety_inspections_inspection_date ON safety_inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_non_conformities_status ON non_conformities(status);
CREATE INDEX IF NOT EXISTS idx_non_conformities_due_date ON non_conformities(due_date);
CREATE INDEX IF NOT EXISTS idx_cipa_members_employee_id ON cipa_members(employee_id);
CREATE INDEX IF NOT EXISTS idx_cipa_members_mandate_year ON cipa_members(mandate_year);
CREATE INDEX IF NOT EXISTS idx_sst_alerts_employee_id ON sst_alerts(employee_id);
CREATE INDEX IF NOT EXISTS idx_sst_alerts_alert_type ON sst_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_sst_alerts_is_read ON sst_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_sst_alerts_due_date ON sst_alerts(due_date);

-- =====================================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA DO updated_at
-- =====================================================

CREATE OR REPLACE TRIGGER update_occupational_risk_types_updated_at
    BEFORE UPDATE ON occupational_risk_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_position_risks_updated_at
    BEFORE UPDATE ON position_risks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_employee_risks_updated_at
    BEFORE UPDATE ON employee_risks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_personal_protective_equipment_updated_at
    BEFORE UPDATE ON personal_protective_equipment
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_risk_required_epis_updated_at
    BEFORE UPDATE ON risk_required_epis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_epi_deliveries_updated_at
    BEFORE UPDATE ON epi_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_medical_exam_types_updated_at
    BEFORE UPDATE ON medical_exam_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_medical_exams_updated_at
    BEFORE UPDATE ON medical_exams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_sst_trainings_updated_at
    BEFORE UPDATE ON sst_trainings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_training_participations_updated_at
    BEFORE UPDATE ON training_participations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_accident_records_updated_at
    BEFORE UPDATE ON accident_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_near_miss_records_updated_at
    BEFORE UPDATE ON near_miss_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_safety_inspections_updated_at
    BEFORE UPDATE ON safety_inspections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_non_conformities_updated_at
    BEFORE UPDATE ON non_conformities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_cipa_members_updated_at
    BEFORE UPDATE ON cipa_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_cipa_meetings_updated_at
    BEFORE UPDATE ON cipa_meetings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_sst_alerts_updated_at
    BEFORE UPDATE ON sst_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DADOS INICIAIS (SEED DATA) - COMENTADOS PARA EVITAR CONFLITOS
-- =====================================================
/*

-- Tipos de Risco Ocupacional
INSERT INTO occupational_risk_types (id, name, description, category, severity_level) VALUES
(gen_random_uuid(), 'Ruído', 'Exposição a níveis de ruído acima dos limites estabelecidos', 'FISICO', 3),
(gen_random_uuid(), 'Calor', 'Exposição a temperaturas elevadas', 'FISICO', 2),
(gen_random_uuid(), 'Frio', 'Exposição a temperaturas baixas', 'FISICO', 2),
(gen_random_uuid(), 'Vibração', 'Exposição a vibrações mecânicas', 'FISICO', 3),
(gen_random_uuid(), 'Radiação', 'Exposição a radiações ionizantes ou não ionizantes', 'FISICO', 4),
(gen_random_uuid(), 'Produtos Químicos', 'Exposição a substâncias químicas tóxicas', 'QUIMICO', 4),
(gen_random_uuid(), 'Poeiras', 'Exposição a poeiras orgânicas ou inorgânicas', 'QUIMICO', 3),
(gen_random_uuid(), 'Fumos', 'Exposição a fumos metálicos ou orgânicos', 'QUIMICO', 3),
(gen_random_uuid(), 'Gases', 'Exposição a gases tóxicos ou asfixiantes', 'QUIMICO', 4),
(gen_random_uuid(), 'Vapores', 'Exposição a vapores de solventes ou outros produtos', 'QUIMICO', 3),
(gen_random_uuid(), 'Vírus', 'Exposição a vírus patogênicos', 'BIOLOGICO', 4),
(gen_random_uuid(), 'Bactérias', 'Exposição a bactérias patogênicas', 'BIOLOGICO', 3),
(gen_random_uuid(), 'Fungos', 'Exposição a fungos patogênicos', 'BIOLOGICO', 2),
(gen_random_uuid(), 'Parasitas', 'Exposição a parasitas', 'BIOLOGICO', 2),
(gen_random_uuid(), 'Postura Inadequada', 'Trabalho em posturas inadequadas', 'ERGONOMICO', 2),
(gen_random_uuid(), 'Esforço Físico', 'Esforço físico excessivo', 'ERGONOMICO', 2),
(gen_random_uuid(), 'Repetitividade', 'Movimentos repetitivos', 'ERGONOMICO', 3),
(gen_random_uuid(), 'Levantamento de Peso', 'Levantamento manual de cargas', 'ERGONOMICO', 3),
(gen_random_uuid(), 'Queda de Altura', 'Risco de queda de altura', 'ACIDENTE', 4),
(gen_random_uuid(), 'Choque Elétrico', 'Risco de choque elétrico', 'ACIDENTE', 4),
(gen_random_uuid(), 'Corte', 'Risco de corte com ferramentas', 'ACIDENTE', 3),
(gen_random_uuid(), 'Atropelamento', 'Risco de atropelamento', 'ACIDENTE', 4),
(gen_random_uuid(), 'Incêndio', 'Risco de incêndio', 'ACIDENTE', 4),
(gen_random_uuid(), 'Explosão', 'Risco de explosão', 'ACIDENTE', 4);

-- Tipos de Exames Médicos
INSERT INTO medical_exam_types (id, name, description, exam_category, validity_months, is_mandatory) VALUES
(gen_random_uuid(), 'Exame Admissional', 'Exame médico realizado na admissão do funcionário', 'ADMISSIONAL', NULL, true),
(gen_random_uuid(), 'Exame Periódico', 'Exame médico realizado periodicamente conforme PCMSO', 'PERIODICO', 12, true),
(gen_random_uuid(), 'Exame de Retorno ao Trabalho', 'Exame médico após afastamento por acidente ou doença', 'RETORNO', NULL, true),
(gen_random_uuid(), 'Exame de Mudança de Função', 'Exame médico ao mudar de função com riscos diferentes', 'MUDANCA_FUNCAO', NULL, true),
(gen_random_uuid(), 'Exame Demissional', 'Exame médico realizado na demissão do funcionário', 'DEMISSIONAL', NULL, true);

-- Treinamentos em SST
INSERT INTO sst_trainings (id, name, description, training_type, duration_hours, validity_months, is_mandatory) VALUES
(gen_random_uuid(), 'NR-35 - Trabalho em Altura', 'Treinamento para trabalho em altura conforme NR-35', 'NR_35', 8, 24, true),
(gen_random_uuid(), 'NR-10 - Segurança em Instalações Elétricas', 'Treinamento para trabalhos com eletricidade conforme NR-10', 'NR_10', 40, 24, true),
(gen_random_uuid(), 'NR-33 - Espaços Confinados', 'Treinamento para trabalhos em espaços confinados conforme NR-33', 'NR_33', 16, 12, true),
(gen_random_uuid(), 'CIPA - Comissão Interna de Prevenção de Acidentes', 'Treinamento para membros da CIPA', 'CIPA', 20, 12, true),
(gen_random_uuid(), 'Brigada de Incêndio', 'Treinamento para brigada de incêndio', 'BRIGADA_INCENDIO', 16, 12, true),
(gen_random_uuid(), 'Primeiros Socorros', 'Treinamento em primeiros socorros', 'PRIMEIROS_SOCORROS', 8, 12, true),
(gen_random_uuid(), 'Uso de EPIs', 'Treinamento sobre uso correto de EPIs', 'USO_EPIS', 4, 12, true),
(gen_random_uuid(), 'Segurança no Trabalho', 'Treinamento geral de segurança no trabalho', 'SEGURANCA_GERAL', 8, 12, true);

-- EPIs Básicos
INSERT INTO personal_protective_equipment (id, name, description, category, ca_number, manufacturer, unit_of_measurement, minimum_stock, current_stock, unit_cost) VALUES
(gen_random_uuid(), 'Capacete de Segurança', 'Capacete de segurança classe A', 'CABECA', '12345', '3M', 'UNIDADE', 50, 100, 45.00),
(gen_random_uuid(), 'Óculos de Proteção', 'Óculos de proteção contra impactos', 'OLHOS', '67890', 'Honeywell', 'UNIDADE', 30, 60, 25.00),
(gen_random_uuid(), 'Protetor Auricular', 'Protetor auricular tipo concha', 'AUDITIVO', '11111', '3M', 'UNIDADE', 40, 80, 35.00),
(gen_random_uuid(), 'Máscara PFF2', 'Máscara de proteção respiratória PFF2', 'RESPIRATORIO', '22222', '3M', 'UNIDADE', 200, 500, 8.50),
(gen_random_uuid(), 'Luvas de Segurança', 'Luvas de proteção contra cortes', 'MAOS', '33333', 'Ansell', 'PAR', 100, 200, 15.00),
(gen_random_uuid(), 'Bota de Segurança', 'Bota de segurança com biqueira de aço', 'PES', '44444', 'Brametal', 'PAR', 25, 50, 120.00),
(gen_random_uuid(), 'Cinto de Segurança', 'Cinto de segurança para trabalho em altura', 'CORPO', '55555', '3M', 'UNIDADE', 20, 40, 180.00),
(gen_random_uuid(), 'Avental de Proteção', 'Avental de proteção química', 'CORPO', '66666', 'Dupont', 'UNIDADE', 15, 30, 85.00);
*/

-- =====================================================
-- COMENTÁRIOS DAS TABELAS
-- =====================================================

COMMENT ON TABLE occupational_risk_types IS 'Tipos de riscos ocupacionais conforme NR-15 e NR-16';
COMMENT ON TABLE position_risks IS 'Riscos associados a cada cargo/posição';
COMMENT ON TABLE employee_risks IS 'Riscos específicos por funcionário (exceções/ajustes)';
COMMENT ON TABLE personal_protective_equipment IS 'Catálogo de EPIs disponíveis na empresa';
COMMENT ON TABLE risk_required_epis IS 'Matriz de EPIs obrigatórios por tipo de risco';
COMMENT ON TABLE epi_deliveries IS 'Controle de entrega de EPIs aos funcionários';
COMMENT ON TABLE medical_exam_types IS 'Tipos de exames médicos conforme PCMSO';
COMMENT ON TABLE medical_exams IS 'Controle de exames médicos (ASO) dos funcionários';
COMMENT ON TABLE sst_trainings IS 'Catálogo de treinamentos em SST';
COMMENT ON TABLE training_participations IS 'Controle de participação em treinamentos';
COMMENT ON TABLE accident_records IS 'Registro de acidentes de trabalho';
COMMENT ON TABLE near_miss_records IS 'Registro de quase-acidentes';
COMMENT ON TABLE safety_inspections IS 'Inspeções de segurança realizadas';
COMMENT ON TABLE non_conformities IS 'Não conformidades identificadas';
COMMENT ON TABLE cipa_members IS 'Membros da CIPA por mandato';
COMMENT ON TABLE cipa_meetings IS 'Reuniões da CIPA';
COMMENT ON TABLE sst_alerts IS 'Sistema de alertas e notificações SST';
