-- Criar tabela de vagas com UUID
CREATE TABLE job_vacancies (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    function VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    work_schedule VARCHAR(100) NOT NULL,
    salary DECIMAL(10,2) NOT NULL,
    deadline TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    applications INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Criar tabela de requisitos das vagas
CREATE TABLE job_vacancy_requirements (
    job_vacancy_id UUID NOT NULL,
    requirement VARCHAR(500) NOT NULL,
    FOREIGN KEY (job_vacancy_id) REFERENCES job_vacancies(id) ON DELETE CASCADE
);

-- Criar tabela de benefícios das vagas
CREATE TABLE job_vacancy_benefits (
    job_vacancy_id UUID NOT NULL,
    benefit VARCHAR(500) NOT NULL,
    FOREIGN KEY (job_vacancy_id) REFERENCES job_vacancies(id) ON DELETE CASCADE
);

-- Inserir dados de exemplo com UUIDs
INSERT INTO job_vacancies (id, title, position, function, location, work_schedule, salary, deadline, status, applications, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Vigilante Patrimonial', 'Vigilante', 'Segurança Patrimonial', 'São Paulo, SP', '12x36', 1800.00, '2024-12-31 23:59:59', 'OPEN', 5, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Porteiro', 'Porteiro', 'Atendimento e Controle de Acesso', 'Belo Horizonte, MG', '6x1', 1300.00, '2024-12-31 23:59:59', 'OPEN', 3, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Controlador de Acesso', 'Vigilante', 'Controle de Acesso', 'Betim, MG', '12x36', 1400.00, '2024-12-31 23:59:59', 'OPEN', 2, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'Auxiliar de Facilities', 'ASG', 'Serviços Gerais', 'Contagem, MG', '6x1', 1200.00, '2024-12-31 23:59:59', 'OPEN', 1, NOW(), NOW());

-- Inserir requisitos
INSERT INTO job_vacancy_requirements (job_vacancy_id, requirement) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Ensino Médio Completo'),
('550e8400-e29b-41d4-a716-446655440001', 'Carteira de vigilante válida'),
('550e8400-e29b-41d4-a716-446655440001', 'Disponibilidade para trabalhar em escala 12x36'),
('550e8400-e29b-41d4-a716-446655440001', 'Experiência mínima de 6 meses na função'),
('550e8400-e29b-41d4-a716-446655440002', 'Ensino Médio Completo'),
('550e8400-e29b-41d4-a716-446655440002', 'Boa comunicação'),
('550e8400-e29b-41d4-a716-446655440002', 'Disponibilidade para trabalhar em escala 6x1'),
('550e8400-e29b-41d4-a716-446655440002', 'Experiência com atendimento ao público'),
('550e8400-e29b-41d4-a716-446655440003', 'Ensino Médio Completo'),
('550e8400-e29b-41d4-a716-446655440003', 'Conhecimento básico de informática'),
('550e8400-e29b-41d4-a716-446655440003', 'Disponibilidade para trabalhar em escala 12x36'),
('550e8400-e29b-41d4-a716-446655440003', 'Experiência em controle de acesso'),
('550e8400-e29b-41d4-a716-446655440004', 'Ensino Fundamental Completo'),
('550e8400-e29b-41d4-a716-446655440004', 'Disponibilidade para trabalhar em escala 6x1'),
('550e8400-e29b-41d4-a716-446655440004', 'Experiência em serviços gerais');

-- Inserir benefícios
INSERT INTO job_vacancy_benefits (job_vacancy_id, benefit) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Vale refeição'),
('550e8400-e29b-41d4-a716-446655440001', 'Vale transporte'),
('550e8400-e29b-41d4-a716-446655440001', 'Plano de saúde'),
('550e8400-e29b-41d4-a716-446655440001', 'Plano odontológico'),
('550e8400-e29b-41d4-a716-446655440002', 'Vale refeição'),
('550e8400-e29b-41d4-a716-446655440002', 'Vale transporte'),
('550e8400-e29b-41d4-a716-446655440002', 'Plano de saúde'),
('550e8400-e29b-41d4-a716-446655440003', 'Vale refeição'),
('550e8400-e29b-41d4-a716-446655440003', 'Vale transporte'),
('550e8400-e29b-41d4-a716-446655440003', 'Plano de saúde'),
('550e8400-e29b-41d4-a716-446655440003', 'Plano odontológico'),
('550e8400-e29b-41d4-a716-446655440004', 'Vale refeição'),
('550e8400-e29b-41d4-a716-446655440004', 'Vale transporte'); 