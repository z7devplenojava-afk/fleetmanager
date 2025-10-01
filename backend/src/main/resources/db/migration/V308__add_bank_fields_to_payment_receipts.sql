-- Adicionar campos bancários à tabela payment_receipts
ALTER TABLE payment_receipts 
ADD COLUMN debited_agency VARCHAR(20),
ADD COLUMN debited_account VARCHAR(50),
ADD COLUMN debited_name VARCHAR(255),
ADD COLUMN credited_agency VARCHAR(20),
ADD COLUMN credited_account VARCHAR(50),
ADD COLUMN credited_name VARCHAR(255),
ADD COLUMN control_number VARCHAR(50),
ADD COLUMN authentication_code VARCHAR(100),
ADD COLUMN transfer_date VARCHAR(50),
ADD COLUMN transfer_time VARCHAR(20),
ADD COLUMN bank_name VARCHAR(100),
ADD COLUMN transaction_type VARCHAR(100),
ADD COLUMN statement_identification VARCHAR(255);

-- Adicionar índices para os novos campos
CREATE INDEX idx_payment_receipts_control_number ON payment_receipts(control_number);
CREATE INDEX idx_payment_receipts_authentication_code ON payment_receipts(authentication_code);
CREATE INDEX idx_payment_receipts_transfer_date ON payment_receipts(transfer_date);
