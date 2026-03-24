-- Migration: V215__create_operational_management_tables.sql
-- Cria tabelas para o módulo de gestão operacional
-- Implementa funcionalidades de cobertura de férias, faltas, atribuições de postos e atividades específicas

-- Tabela para cobertura de férias
CREATE TABLE IF NOT EXISTS vacation_coverages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vacation_id UUID,
    substitute_employee_id UUID NOT NULL,
    coverage_start_date DATE NOT NULL,
    coverage_end_date DATE NOT NULL,
    location_id UUID,
    shift VARCHAR(50) NOT NULL,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para faltas dos funcionários (modificada)
CREATE TABLE IF NOT EXISTS absences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    absence_date DATE NOT NULL,
    absence_type VARCHAR(50) NOT NULL,
    reason TEXT,
    medical_certificate_days INTEGER,
    document_url VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    is_justified BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by UUID,
    approval_date TIMESTAMP,
    coverage_employee_id UUID,
    coverage_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para atribuições de postos de trabalho
CREATE TABLE IF NOT EXISTS work_post_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    work_post_id UUID NOT NULL,
    assignment_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    shift VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    assigned_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para atividades específicas (modificada)
CREATE TABLE IF NOT EXISTS specific_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    activity_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location_id UUID,
    description TEXT,
    observations TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completion_notes TEXT,
    assigned_by UUID,
    supervised_by UUID,
    completion_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_vacation_coverages_employee ON vacation_coverages(substitute_employee_id);
CREATE INDEX IF NOT EXISTS idx_vacation_coverages_dates ON vacation_coverages(coverage_start_date, coverage_end_date);
CREATE INDEX IF NOT EXISTS idx_vacation_coverages_status ON vacation_coverages(status);

CREATE INDEX IF NOT EXISTS idx_absences_employee ON absences(employee_id);
CREATE INDEX IF NOT EXISTS idx_absences_date ON absences(absence_date);
CREATE INDEX IF NOT EXISTS idx_absences_type ON absences(absence_type);
CREATE INDEX IF NOT EXISTS idx_absences_status ON absences(status);

CREATE INDEX IF NOT EXISTS idx_work_post_assignments_employee ON work_post_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_work_post_assignments_post ON work_post_assignments(work_post_id);
CREATE INDEX IF NOT EXISTS idx_work_post_assignments_date ON work_post_assignments(assignment_date);
CREATE INDEX IF NOT EXISTS idx_work_post_assignments_status ON work_post_assignments(status);

CREATE INDEX IF NOT EXISTS idx_specific_activities_employee ON specific_activities(employee_id);
CREATE INDEX IF NOT EXISTS idx_specific_activities_date ON specific_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_specific_activities_type ON specific_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_specific_activities_status ON specific_activities(status);

-- Comentários nas tabelas
COMMENT ON TABLE vacation_coverages IS 'Gerencia coberturas de férias - substituições temporárias';
COMMENT ON TABLE absences IS 'Controla faltas dos funcionários com justificativas e cobertura';
COMMENT ON TABLE work_post_assignments IS 'Atribui funcionários a postos de trabalho específicos';
COMMENT ON TABLE specific_activities IS 'Gerencia atividades específicas como limpeza, manutenção, etc.';

-- Comentários nas colunas principais
COMMENT ON COLUMN vacation_coverages.substitute_employee_id IS 'Funcionário que substitui durante as férias';
COMMENT ON COLUMN vacation_coverages.coverage_start_date IS 'Data de início da cobertura';
COMMENT ON COLUMN vacation_coverages.coverage_end_date IS 'Data de fim da cobertura';

COMMENT ON COLUMN absences.absence_type IS 'Tipo da falta: SICK_LEAVE, PERSONAL_LEAVE, UNAUTHORIZED, etc.';
COMMENT ON COLUMN absences.medical_certificate_days IS 'Número de dias do atestado médico';
COMMENT ON COLUMN absences.coverage_employee_id IS 'Funcionário que cobre a falta';

COMMENT ON COLUMN work_post_assignments.shift IS 'Turno de trabalho: DAY, NIGHT, MIXED';
COMMENT ON COLUMN work_post_assignments.assigned_by IS 'Usuário que fez a atribuição';

COMMENT ON COLUMN specific_activities.activity_type IS 'Tipo da atividade: CLEANING, MAINTENANCE, etc.';
COMMENT ON COLUMN specific_activities.is_completed IS 'Se a atividade foi concluída';
COMMENT ON COLUMN specific_activities.completion_notes IS 'Notas sobre a conclusão da atividade';