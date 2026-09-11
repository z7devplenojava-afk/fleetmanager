-- Adiciona colunas de Cliente e Posto de Trabalho (Obra) na tabela de mobilizações
ALTER TABLE transport_mobilizations ADD COLUMN client_id UUID;
ALTER TABLE transport_mobilizations ADD COLUMN client_name VARCHAR(255);
ALTER TABLE transport_mobilizations ADD COLUMN work_post_id UUID;
ALTER TABLE transport_mobilizations ADD COLUMN work_post_name VARCHAR(255);

-- Foreign keys
ALTER TABLE transport_mobilizations
    ADD CONSTRAINT fk_transport_mobilization_client
    FOREIGN KEY (client_id) REFERENCES clients(id);

ALTER TABLE transport_mobilizations
    ADD CONSTRAINT fk_transport_mobilization_work_post
    FOREIGN KEY (work_post_id) REFERENCES work_posts(id);

-- Índices para performance
CREATE INDEX idx_transport_mobilizations_client_id ON transport_mobilizations(client_id);
CREATE INDEX idx_transport_mobilizations_work_post_id ON transport_mobilizations(work_post_id);
