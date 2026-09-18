-- =====================================================================
-- Gestão de Garagens (V4592)
-- - Cadastro de garagens com responsável
-- - vehicle.garage_id (referência da garagem do veículo)
-- - fleet_work_orders.garage_id (garagem executora da OS)
-- - transport_mobilizations.garage_id + garage_purpose (garagem de destino)
-- - Backfill: cria garagens a partir de vehicle.garage_name
-- =====================================================================

CREATE TABLE IF NOT EXISTS garages (
    id UUID PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(500),
    responsible_employee_id UUID,
    responsible_name VARCHAR(200),
    responsible_phone VARCHAR(30),
    capacity INTEGER,
    notes VARCHAR(500),
    company_id UUID,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_garages_company ON garages (company_id);

-- Veículo: garagem onde está recolhido
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS garage_id UUID;

-- OS de Frota: garagem executora
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS garage_id UUID;

-- Mobilização: garagem de destino + motivo
ALTER TABLE transport_mobilizations ADD COLUMN IF NOT EXISTS garage_id UUID;
ALTER TABLE transport_mobilizations ADD COLUMN IF NOT EXISTS garage_purpose VARCHAR(30);

-- Backfill: garagens existentes apenas como nome livre no veículo
INSERT INTO garages (id, name, company_id, active, created_at, updated_at)
SELECT gen_random_uuid(), v.garage_name, v.company_id, TRUE, NOW(), NOW()
FROM vehicles v
WHERE v.garage_name IS NOT NULL AND v.garage_name <> ''
  AND v.company_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM garages g
      WHERE g.company_id = v.company_id
        AND LOWER(TRIM(g.name)) = LOWER(TRIM(v.garage_name))
  );

UPDATE vehicles v
SET garage_id = g.id
FROM garages g
WHERE v.garage_id IS NULL
  AND v.company_id IS NOT NULL
  AND LOWER(TRIM(g.name)) = LOWER(TRIM(v.garage_name))
  AND g.company_id = v.company_id;
