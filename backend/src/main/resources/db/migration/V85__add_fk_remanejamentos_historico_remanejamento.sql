ALTER TABLE remanejamentos_historico
ADD CONSTRAINT fk_remanejamentos_historico_remanejamento
FOREIGN KEY (remanejamento_id) REFERENCES remanejamentos(id) ON DELETE CASCADE; 