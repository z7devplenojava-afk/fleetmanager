-- Migration: V4632__add_lineage_fields_to_invoices.sql
-- Description: Adiciona campos de rastreabilidade de origem (OS -> Cotação -> Ordem de Compra -> Contas a Pagar)

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS work_order_id UUID REFERENCES fleet_work_orders(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS work_order_number VARCHAR(100);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS requisition_id UUID REFERENCES material_requisitions(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS requisition_number VARCHAR(100);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS purchase_order_id UUID REFERENCES procurement_purchase_orders(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS purchase_order_number VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_invoices_work_order ON invoices(work_order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_purchase_order ON invoices(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_requisition ON invoices(requisition_id);
