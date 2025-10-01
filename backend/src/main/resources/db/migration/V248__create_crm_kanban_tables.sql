-- CRM Kanban: Tabelas principais

CREATE TABLE kanban_status (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    order_index INTEGER NOT NULL
);

CREATE TABLE opportunities (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    client_id BIGINT REFERENCES clients(id),
    lead_id BIGINT REFERENCES leads(id),
    status_id BIGINT NOT NULL REFERENCES kanban_status(id),
    assigned_to_id UUID REFERENCES users(id),
    estimated_value NUMERIC(15,2),
    close_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    opportunity_id BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    assigned_to_id UUID REFERENCES users(id),
    due_date TIMESTAMP,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE interaction_history (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
); 