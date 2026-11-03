-- V4686: Adicionar campos de data de admissão e demissão e endereço de embarque para funcionários/passageiros
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS admission_date DATE;
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS dismissal_date DATE;
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS boarding_cep VARCHAR(10);
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS boarding_street VARCHAR(150);
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS boarding_number VARCHAR(20);
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS boarding_neighborhood VARCHAR(100);
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS boarding_city VARCHAR(100);
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS boarding_state VARCHAR(2);

-- Comentários para documentação do schema
COMMENT ON COLUMN passengers.admission_date IS 'Data de admissão do colaborador na empresa contratante';
COMMENT ON COLUMN passengers.dismissal_date IS 'Data de desligamento/demissão do colaborador';
COMMENT ON COLUMN passengers.boarding_cep IS 'CEP do local/ponto de embarque do colaborador';
COMMENT ON COLUMN passengers.boarding_street IS 'Endereço/rua onde o colaborador aguarda o embarque';
