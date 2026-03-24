-- Migration V368: Add installments column to purchase_requests table
ALTER TABLE purchase_requests 
ADD COLUMN IF NOT EXISTS installments INTEGER;

















