-- V4648: Criação das tabelas de Gestão de Atestados e Base de CID-10

-- 1. Tabela de catálogo do CID-10 (Código Internacional de Doenças)
CREATE TABLE IF NOT EXISTS cid10_entries (
    code VARCHAR(15) PRIMARY KEY,
    description VARCHAR(500) NOT NULL,
    category VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cid10_code_prefix ON cid10_entries (code);
CREATE INDEX IF NOT EXISTS idx_cid10_description_lower ON cid10_entries (LOWER(description));

-- Carga inicial de CIDs comuns em atestados médicos e afastamentos do trabalho
INSERT INTO cid10_entries (code, description, category) VALUES
('A09', 'Diarreia e gastroenterite de origem infecciosa presumível', 'Doenças Infecciosas e Parasitárias'),
('B34.2', 'Infecção por coronavírus de localização não especificada (COVID-19)', 'Doenças Infecciosas e Parasitárias'),
('B34.9', 'Infecção viral não especificada', 'Doenças Infecciosas e Parasitárias'),
('F32', 'Episódios depressivos', 'Transtornos Mentais e Comportamentais'),
('F32.0', 'Episódio depressivo leve', 'Transtornos Mentais e Comportamentais'),
('F32.1', 'Episódio depressivo moderado', 'Transtornos Mentais e Comportamentais'),
('F32.2', 'Episódio depressivo grave sem sintomas psicóticos', 'Transtornos Mentais e Comportamentais'),
('F41', 'Outros transtornos de ansiedade', 'Transtornos Mentais e Comportamentais'),
('F41.0', 'Transtorno de pânico (ansiedade paroxística episódica)', 'Transtornos Mentais e Comportamentais'),
('F41.1', 'Ansiedade generalizada', 'Transtornos Mentais e Comportamentais'),
('F41.2', 'Transtorno misto ansioso e depressivo', 'Transtornos Mentais e Comportamentais'),
('F43', 'Reações ao estresse grave e transtornos de adaptação', 'Transtornos Mentais e Comportamentais'),
('F43.0', 'Reação aguda ao estresse', 'Transtornos Mentais e Comportamentais'),
('G43', 'Enxaqueca', 'Doenças do Sistema Nervoso'),
('G43.9', 'Enxaqueca sem especificação', 'Doenças do Sistema Nervoso'),
('G44', 'Outras síndromes de cefaleia', 'Doenças do Sistema Nervoso'),
('H10', 'Conjuntivite', 'Doenças do Olho e Anexos'),
('H10.9', 'Conjuntivite não especificada', 'Doenças do Olho e Anexos'),
('H66', 'Otite média supurativa e a não especificada', 'Doenças do Ouvido e Apófise Mastóide'),
('J00', 'Nasofaringite aguda (resfriado comum)', 'Doenças do Aparelho Respiratório'),
('J01', 'Sinusite aguda', 'Doenças do Aparelho Respiratório'),
('J02', 'Faringite aguda', 'Doenças do Aparelho Respiratório'),
('J03', 'Amigdalite aguda', 'Doenças do Aparelho Respiratório'),
('J04', 'Laringite e traqueíte agudas', 'Doenças do Aparelho Respiratório'),
('J06', 'Infecções agudas das vias aéreas superiores de localizações múltiplas e não especificadas', 'Doenças do Aparelho Respiratório'),
('J06.9', 'Infecção aguda das vias aéreas superiores, não especificada', 'Doenças do Aparelho Respiratório'),
('J10', 'Influenza devida a vírus da influenza identificado', 'Doenças do Aparelho Respiratório'),
('J11', 'Influenza devida a vírus não identificado (Gripe comum)', 'Doenças do Aparelho Respiratório'),
('J12', 'Pneumonia viral não classificada em outra parte', 'Doenças do Aparelho Respiratório'),
('J18', 'Pneumonia por micro-organismo não especificado', 'Doenças do Aparelho Respiratório'),
('J20', 'Bronquite aguda', 'Doenças do Aparelho Respiratório'),
('J45', 'Asma', 'Doenças do Aparelho Respiratório'),
('K21', 'Doença de refluxo gastroesofágico', 'Doenças do Aparelho Digestivo'),
('K29', 'Gastrite e duodenite', 'Doenças do Aparelho Digestivo'),
('K29.7', 'Gastrite não especificada', 'Doenças do Aparelho Digestivo'),
('K30', 'Dispepsia', 'Doenças do Aparelho Digestivo'),
('K52', 'Outras gastroenterites e colites não infecciosas', 'Doenças do Aparelho Digestivo'),
('K52.9', 'Gastroenterite e colite não infecciosas, não especificadas', 'Doenças do Aparelho Digestivo'),
('M54', 'Dorsalgia', 'Doenças do Sistema Osteomuscular'),
('M54.2', 'Cervicalgia', 'Doenças do Sistema Osteomuscular'),
('M54.4', 'Lumbago com ciática', 'Doenças do Sistema Osteomuscular'),
('M54.5', 'Dor lombar baixa (Lombalgia)', 'Doenças do Sistema Osteomuscular'),
('M65', 'Sinovite e tenossinovite', 'Doenças do Sistema Osteomuscular'),
('M75', 'Lesões do ombro', 'Doenças do Sistema Osteomuscular'),
('M75.1', 'Síndrome do manguito rotador', 'Doenças do Sistema Osteomuscular'),
('M77', 'Outras entesopatias', 'Doenças do Sistema Osteomuscular'),
('M79', 'Outros transtornos dos tecidos moles', 'Doenças do Sistema Osteomuscular'),
('M79.1', 'Mialgia', 'Doenças do Sistema Osteomuscular'),
('N39.0', 'Infecção do trato urinário de localização não especificada', 'Doenças do Aparelho Geniturinário'),
('O80', 'Parto único espontâneo', 'Gravidez, Parto e Puerpério'),
('O82', 'Parto por cesariana', 'Gravidez, Parto e Puerpério'),
('R10', 'Dor abdominal e pélvica', 'Sintomas e Sinais Gerais'),
('R50', 'Febre de outra origem e de origem desconhecida', 'Sintomas e Sinais Gerais'),
('R51', 'Cefaleia', 'Sintomas e Sinais Gerais'),
('R53', 'Mal-estar e fadiga', 'Sintomas e Sinais Gerais'),
('S60', 'Traumatismo superficial do punho e da mão', 'Lesões e Traumatismos'),
('S62', 'Fratura ao nível do punho e da mão', 'Lesões e Traumatismos'),
('S63', 'Luxação, entorse e distensão das articulações e dos ligamentos ao nível do punho e da mão', 'Lesões e Traumatismos'),
('S83', 'Luxação, entorse e distensão das articulações e dos ligamentos do joelho', 'Lesões e Traumatismos'),
('S93', 'Luxação, entorse e distensão das articulações e dos ligamentos ao nível do tornozelo e do pé', 'Lesões e Traumatismos'),
('T14', 'Traumatismo de região não especificada do corpo', 'Lesões e Traumatismos'),
('Z00', 'Exame geral e investigação de pessoas sem queixas ou diagnóstico relatado', 'Fatores que Influenciam o Estado de Saúde'),
('Z01', 'Outros exames e investigações especiais de pessoas sem queixa ou diagnóstico relatado', 'Fatores que Influenciam o Estado de Saúde'),
('Z02', 'Exame para fins administrativos (admissional / periódico)', 'Fatores que Influenciam o Estado de Saúde'),
('Z39', 'Assistência e exame pós-parto', 'Fatores que Influenciam o Estado de Saúde'),
('Z76.5', 'Pessoa fingindo ser doente (simulação consciente)', 'Fatores que Influenciam o Estado de Saúde')
ON CONFLICT (code) DO NOTHING;

-- 2. Tabela de Atestados Médicos e Afastamentos (Medical Certificates)
CREATE TABLE IF NOT EXISTS medical_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    type VARCHAR(60) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INTEGER NOT NULL DEFAULT 1,
    absence_hours NUMERIC(6,2) NOT NULL DEFAULT 8.0,
    is_partial_day BOOLEAN NOT NULL DEFAULT FALSE,
    cid_code VARCHAR(20),
    cid_description VARCHAR(500),
    doctor_name VARCHAR(150),
    doctor_crm VARCHAR(50),
    doctor_specialty VARCHAR(100),
    document_url VARCHAR(500),
    document_name VARCHAR(255),
    document_type VARCHAR(100),
    notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'APROVADO',
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_medical_certificates_employee_id ON medical_certificates(employee_id);
CREATE INDEX IF NOT EXISTS idx_medical_certificates_company_id ON medical_certificates(company_id);
CREATE INDEX IF NOT EXISTS idx_medical_certificates_dates ON medical_certificates(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_medical_certificates_type ON medical_certificates(type);
CREATE INDEX IF NOT EXISTS idx_medical_certificates_status ON medical_certificates(status);
CREATE INDEX IF NOT EXISTS idx_medical_certificates_cid ON medical_certificates(cid_code);
