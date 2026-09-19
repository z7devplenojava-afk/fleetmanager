-- Migration V4600: Adiciona campos de código, aprovação e motivo aos itens de ordem de serviço (work_order_items)
ALTER TABLE work_order_items
ADD COLUMN IF NOT EXISTS code VARCHAR(50),
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS approval_reason TEXT,
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS approved_by VARCHAR(150),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_work_order_items_code ON work_order_items(code);
