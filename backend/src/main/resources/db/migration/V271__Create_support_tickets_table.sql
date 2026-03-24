-- Migration: Create support_tickets table
-- Description: Tabela para armazenar tickets de atendimento

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    category VARCHAR(50) NOT NULL,
    assigned_to UUID REFERENCES support_agents(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,
    
    CONSTRAINT fk_ticket_agent FOREIGN KEY (assigned_to) REFERENCES support_agents(id) ON DELETE SET NULL,
    CONSTRAINT fk_ticket_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT check_ticket_priority CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    CONSTRAINT check_ticket_status CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED')),
    CONSTRAINT check_ticket_category CHECK (category IN ('SYSTEM_ACCESS', 'TECHNICAL_SUPPORT', 'BILLING', 'REPORTS', 'GENERAL_INQUIRY', 'BUG_REPORT', 'FEATURE_REQUEST', 'OTHER'))
);

-- Índices para melhor performance
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_category ON support_tickets(category);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_company_id ON support_tickets(company_id);
CREATE INDEX idx_support_tickets_customer_email ON support_tickets(customer_email);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);

-- Comentários
COMMENT ON TABLE support_tickets IS 'Tabela para armazenar tickets de atendimento';
COMMENT ON COLUMN support_tickets.id IS 'ID único do ticket';
COMMENT ON COLUMN support_tickets.title IS 'Título do ticket';
COMMENT ON COLUMN support_tickets.description IS 'Descrição detalhada do problema ou solicitação';
COMMENT ON COLUMN support_tickets.priority IS 'Prioridade do ticket (LOW, NORMAL, HIGH, URGENT)';
COMMENT ON COLUMN support_tickets.status IS 'Status atual do ticket';
COMMENT ON COLUMN support_tickets.category IS 'Categoria do ticket';
COMMENT ON COLUMN support_tickets.assigned_to IS 'Agente responsável pelo ticket';
COMMENT ON COLUMN support_tickets.customer_name IS 'Nome do cliente que abriu o ticket';
COMMENT ON COLUMN support_tickets.customer_email IS 'Email do cliente';
COMMENT ON COLUMN support_tickets.customer_phone IS 'Telefone do cliente';
COMMENT ON COLUMN support_tickets.company_id IS 'Empresa relacionada ao ticket';
COMMENT ON COLUMN support_tickets.resolved_at IS 'Data e hora em que o ticket foi resolvido';
COMMENT ON COLUMN support_tickets.closed_at IS 'Data e hora em que o ticket foi fechado';

