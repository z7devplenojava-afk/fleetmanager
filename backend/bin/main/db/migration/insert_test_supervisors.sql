-- Inserir dados de teste para supervisores
INSERT INTO supervisors (name, cpf, email, phone, is_active) VALUES
('João Silva Supervisor', '123.456.789-01', 'joao.supervisor@empresa.com', '(11) 99999-0001', true),
('Maria Santos Supervisor', '123.456.789-02', 'maria.supervisor@empresa.com', '(11) 99999-0002', true),
('Carlos Oliveira Supervisor', '123.456.789-03', 'carlos.supervisor@empresa.com', '(11) 99999-0003', true),
('Ana Costa Supervisor', '123.456.789-04', 'ana.supervisor@empresa.com', '(11) 99999-0004', true),
('Pedro Almeida Supervisor', '123.456.789-05', 'pedro.supervisor@empresa.com', '(11) 99999-0005', false)
ON CONFLICT (cpf) DO NOTHING;
