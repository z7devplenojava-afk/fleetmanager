-- Migration: V4633__add_missing_fields_for_vco_invoice.sql
-- Description: Adiciona colunas faltantes em vehicle_cleaning_orders, invoices e employees para resolver erros de SQL na inicialização/CI

ALTER TABLE vehicle_cleaning_orders ADD COLUMN IF NOT EXISTS os_number VARCHAR(50);
ALTER TABLE vehicle_cleaning_orders ADD COLUMN IF NOT EXISTS work_order_id UUID REFERENCES fleet_work_orders(id) ON DELETE SET NULL;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS dda_invoice_id UUID;

ALTER TABLE employees ADD COLUMN IF NOT EXISTS conta_corrente_digito VARCHAR(10);
