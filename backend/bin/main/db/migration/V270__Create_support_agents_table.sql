-- Migration: Create support_agents table
-- Description: Tabela para armazenar agentes de atendimento

CREATE TABLE IF NOT EXISTS support_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'OFFLINE',
    department VARCHAR(100),
    last_activity TIMESTAMP,
    total_tickets INTEGER DEFAULT 0,
    resolved_tickets INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_support_agent_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT check_agent_status CHECK (status IN ('ONLINE', 'OFFLINE', 'BUSY', 'AWAY'))
);

-- Índices para melhor performance
CREATE INDEX idx_support_agents_user_id ON support_agents(user_id);
CREATE INDEX idx_support_agents_status ON support_agents(status);
CREATE INDEX idx_support_agents_active ON support_agents(active);
CREATE INDEX idx_support_agents_department ON support_agents(department);

-- Comentários
COMMENT ON TABLE support_agents IS 'Tabela para armazenar agentes de atendimento';
COMMENT ON COLUMN support_agents.id IS 'ID único do agente';
COMMENT ON COLUMN support_agents.user_id IS 'Referência ao usuário do sistema';
COMMENT ON COLUMN support_agents.status IS 'Status atual do agente (ONLINE, OFFLINE, BUSY, AWAY)';
COMMENT ON COLUMN support_agents.department IS 'Departamento ao qual o agente pertence';
COMMENT ON COLUMN support_agents.last_activity IS 'Última atividade do agente';
COMMENT ON COLUMN support_agents.total_tickets IS 'Total de tickets atribuídos ao agente';
COMMENT ON COLUMN support_agents.resolved_tickets IS 'Total de tickets resolvidos pelo agente';
COMMENT ON COLUMN support_agents.active IS 'Indica se o agente está ativo';

