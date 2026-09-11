-- Adiciona custo mÃ©dio por unidade (Total MÃ©dio) ao estoque
ALTER TABLE stock_items ADD COLUMN average_cost DECIMAL(10,2);
