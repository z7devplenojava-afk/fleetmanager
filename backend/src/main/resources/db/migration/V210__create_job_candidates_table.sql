-- Criar tabela de candidatos
CREATE TABLE job_candidates (
    id UUID PRIMARY KEY,
    job_vacancy_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    cpf VARCHAR(14) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    education_level VARCHAR(100),
    experience_years INTEGER,
    current_position VARCHAR(255),
    current_company VARCHAR(255),
    expected_salary DECIMAL(10,2),
    availability VARCHAR(100),
    curriculum_file_name VARCHAR(255),
    curriculum_file_path VARCHAR(500),
    curriculum_file_size BIGINT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (job_vacancy_id) REFERENCES job_vacancies(id) ON DELETE CASCADE
);

-- Criar índices para melhor performance
CREATE INDEX idx_candidates_vacancy_id ON job_candidates(job_vacancy_id);
CREATE INDEX idx_candidates_status ON job_candidates(status);
CREATE INDEX idx_candidates_email ON job_candidates(email);
CREATE INDEX idx_candidates_cpf ON job_candidates(cpf);

-- Inserir dados de exemplo
INSERT INTO job_candidates (id, job_vacancy_id, name, email, phone, cpf, address, city, state, education_level, experience_years, current_position, current_company, expected_salary, availability, curriculum_file_name, curriculum_file_path, curriculum_file_size, status, notes, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'João Silva Santos', 'joao.silva@email.com', '(11) 99999-9999', '123.456.789-00', 'Rua das Flores, 123', 'São Paulo', 'SP', 'Ensino Médio Completo', 3, 'Vigilante', 'Segurança Total Ltda', 1800.00, 'Imediata', 'joao_silva_cv.pdf', '/uploads/cv/joao_silva_cv.pdf', 1024000, 'PENDING', 'Candidato com boa experiência', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Maria Oliveira Costa', 'maria.oliveira@email.com', '(11) 88888-8888', '987.654.321-00', 'Av. Paulista, 456', 'São Paulo', 'SP', 'Ensino Superior Incompleto', 1, 'Auxiliar de Segurança', 'Proteção Segura', 1600.00, '15 dias', 'maria_oliveira_cv.pdf', '/uploads/cv/maria_oliveira_cv.pdf', 850000, 'APPROVED', 'Candidata aprovada para entrevista', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Pedro Santos Lima', 'pedro.santos@email.com', '(31) 77777-7777', '456.789.123-00', 'Rua da Liberdade, 789', 'Belo Horizonte', 'MG', 'Ensino Médio Completo', 2, 'Porteiro', 'Condomínio Central', 1300.00, 'Imediata', 'pedro_santos_cv.pdf', '/uploads/cv/pedro_santos_cv.pdf', 1200000, 'REJECTED', 'Não atende aos requisitos mínimos', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'Ana Costa Ferreira', 'ana.costa@email.com', '(31) 66666-6666', '789.123.456-00', 'Rua das Palmeiras, 321', 'Betim', 'MG', 'Ensino Técnico', 4, 'Controlador de Acesso', 'Sistema de Segurança MG', 1500.00, '30 dias', 'ana_costa_cv.pdf', '/uploads/cv/ana_costa_cv.pdf', 950000, 'PENDING', 'Aguardando análise', NOW(), NOW()); 