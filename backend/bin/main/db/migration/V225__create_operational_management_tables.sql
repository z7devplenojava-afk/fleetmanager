-- Migração para criar tabelas de gestão operacional baseadas nos quadros manuais
-- V400: Criação das tabelas de gestão operacional

-- Tabela de coberturas de férias
CREATE TABLE IF NOT EXISTS vacation_coverages (
    id UUID PRIMARY KEY,
    vacation_id UUID NOT NULL,
    substitute_employee_id UUID NOT NULL,
    coverage_start_date DATE NOT NULL,
    coverage_end_date DATE NOT NULL,
    location_id UUID,
    shift VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    observations TEXT,
    is_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    confirmed_by UUID,
    confirmation_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vacation_id) REFERENCES vacations(id),
    FOREIGN KEY (substitute_employee_id) REFERENCES employees(id),
    FOREIGN KEY (location_id) REFERENCES work_posts(id),
    FOREIGN KEY (confirmed_by) REFERENCES users(id)
);

-- Tabela de faltas/ausências
CREATE TABLE IF NOT EXISTS absences (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL,
    absence_date DATE NOT NULL,
    absence_type VARCHAR(30) NOT NULL,
    reason TEXT,
    medical_certificate_days INTEGER,
    document_url VARCHAR(500),
    status VARCHAR(20) NOT NULL,
    is_justified BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by UUID,
    approval_date TIMESTAMP,
    coverage_employee_id UUID,
    coverage_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (coverage_employee_id) REFERENCES employees(id)
);

-- Tabela de atribuições de postos
CREATE TABLE IF NOT EXISTS work_post_assignments (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL,
    work_post_id UUID NOT NULL,
    assignment_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    shift_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    is_primary_assignment BOOLEAN NOT NULL DEFAULT TRUE,
    is_backup_assignment BOOLEAN NOT NULL DEFAULT FALSE,
    observations TEXT,
    special_instructions TEXT,
    assigned_by UUID,
    assignment_date_time TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (work_post_id) REFERENCES work_posts(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id)
);

-- Tabela de atividades específicas
CREATE TABLE IF NOT EXISTS specific_activities (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL,
    activity_type VARCHAR(30) NOT NULL,
    activity_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location_id UUID,
    description TEXT,
    observations TEXT,
    status VARCHAR(20) NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completion_notes TEXT,
    assigned_by UUID,
    supervised_by UUID,
    completion_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (location_id) REFERENCES work_posts(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    FOREIGN KEY (supervised_by) REFERENCES users(id)
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_vacation_coverages_vacation_id ON vacation_coverages(vacation_id);
CREATE INDEX IF NOT EXISTS idx_vacation_coverages_substitute_id ON vacation_coverages(substitute_employee_id);
CREATE INDEX IF NOT EXISTS idx_vacation_coverages_dates ON vacation_coverages(coverage_start_date, coverage_end_date);

CREATE INDEX IF NOT EXISTS idx_absences_employee_id ON absences(employee_id);
CREATE INDEX IF NOT EXISTS idx_absences_date ON absences(absence_date);
CREATE INDEX IF NOT EXISTS idx_absences_status ON absences(status);

CREATE INDEX IF NOT EXISTS idx_work_post_assignments_employee_id ON work_post_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_work_post_assignments_post_id ON work_post_assignments(work_post_id);
CREATE INDEX IF NOT EXISTS idx_work_post_assignments_date ON work_post_assignments(assignment_date);

CREATE INDEX IF NOT EXISTS idx_specific_activities_employee_id ON specific_activities(employee_id);
CREATE INDEX IF NOT EXISTS idx_specific_activities_date ON specific_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_specific_activities_type ON specific_activities(activity_type);

-- Comentários nas tabelas
COMMENT ON TABLE vacation_coverages IS 'Gerencia coberturas de férias com substitutos designados';
COMMENT ON TABLE absences IS 'Controla faltas e ausências dos funcionários';
COMMENT ON TABLE work_post_assignments IS 'Atribuições de funcionários a postos específicos';
COMMENT ON TABLE specific_activities IS 'Atividades específicas como limpeza, poda, manutenção';
