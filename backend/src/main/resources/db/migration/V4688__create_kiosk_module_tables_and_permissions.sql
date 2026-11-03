-- Migration V4688: Criar tabelas e permissões do Módulo Gestão de Totens (Digital Signage / Kiosk)

-- 1. Tabela de Dispositivos (Totens)
CREATE TABLE IF NOT EXISTS kiosk_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    device_code VARCHAR(64) NOT NULL UNIQUE,
    platform VARCHAR(50) DEFAULT 'UNKNOWN',
    platform_version VARCHAR(50),
    player_version VARCHAR(50),
    resolution_width INT DEFAULT 1080,
    resolution_height INT DEFAULT 1920,
    orientation VARCHAR(20) DEFAULT 'PORTRAIT',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_PAIRING',
    last_heartbeat_at TIMESTAMP WITH TIME ZONE,
    active_presentation_version_id UUID,
    desired_presentation_version_id UUID,
    paired_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kiosk_devices_company ON kiosk_devices(company_id);
CREATE INDEX IF NOT EXISTS idx_kiosk_devices_client ON kiosk_devices(client_id);
CREATE INDEX IF NOT EXISTS idx_kiosk_devices_code ON kiosk_devices(device_code);
CREATE INDEX IF NOT EXISTS idx_kiosk_devices_status ON kiosk_devices(status);

-- 2. Credenciais de Dispositivo (Token autenticador de Totem)
CREATE TABLE IF NOT EXISTS kiosk_device_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES kiosk_devices(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uk_kiosk_device_credentials_device UNIQUE (device_id)
);

CREATE INDEX IF NOT EXISTS idx_kiosk_credentials_hash ON kiosk_device_credentials(token_hash);

-- 3. Códigos Temporários de Pareamento
CREATE TABLE IF NOT EXISTS kiosk_pairing_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES kiosk_devices(id) ON DELETE CASCADE,
    pairing_code VARCHAR(12) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts_count INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kiosk_pairing_code ON kiosk_pairing_codes(pairing_code);
CREATE INDEX IF NOT EXISTS idx_kiosk_pairing_device ON kiosk_pairing_codes(device_id);

-- 4. Biblioteca de Mídias
CREATE TABLE IF NOT EXISTS kiosk_media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    media_type VARCHAR(50) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    checksum_sha256 VARCHAR(64) NOT NULL,
    duration_ms BIGINT,
    width INT,
    height INT,
    thumbnail_storage_key VARCHAR(500),
    processing_status VARCHAR(50) NOT NULL DEFAULT 'READY',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kiosk_media_company ON kiosk_media_assets(company_id);
CREATE INDEX IF NOT EXISTS idx_kiosk_media_type ON kiosk_media_assets(media_type);

-- 5. Apresentações
CREATE TABLE IF NOT EXISTS kiosk_presentations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    home_slide_id UUID,
    idle_timeout_seconds INT NOT NULL DEFAULT 60,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kiosk_presentations_company ON kiosk_presentations(company_id);
CREATE INDEX IF NOT EXISTS idx_kiosk_presentations_status ON kiosk_presentations(status);

-- 6. Versões Imutáveis de Apresentação
CREATE TABLE IF NOT EXISTS kiosk_presentation_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID NOT NULL REFERENCES kiosk_presentations(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    manifest_json JSONB NOT NULL,
    checksum_sha256 VARCHAR(64) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    published_by UUID REFERENCES users(id) ON DELETE SET NULL,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_kiosk_pres_versions UNIQUE (presentation_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_kiosk_pres_versions_pres ON kiosk_presentation_versions(presentation_id);

-- 7. Slides
CREATE TABLE IF NOT EXISTS kiosk_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID NOT NULL REFERENCES kiosk_presentations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    position INT NOT NULL DEFAULT 0,
    duration_ms BIGINT,
    transition_type VARCHAR(50) NOT NULL DEFAULT 'FADE',
    interaction_mode VARCHAR(50) NOT NULL DEFAULT 'AUTOMATIC',
    background_type VARCHAR(50) NOT NULL DEFAULT 'COLOR',
    background_media_id UUID REFERENCES kiosk_media_assets(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kiosk_slides_pres ON kiosk_slides(presentation_id, position);

-- 8. Elementos de Slide
CREATE TABLE IF NOT EXISTS kiosk_slide_elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slide_id UUID NOT NULL REFERENCES kiosk_slides(id) ON DELETE CASCADE,
    element_type VARCHAR(50) NOT NULL,
    content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    x DOUBLE PRECISION NOT NULL DEFAULT 0,
    y DOUBLE PRECISION NOT NULL DEFAULT 0,
    width DOUBLE PRECISION NOT NULL DEFAULT 100,
    height DOUBLE PRECISION NOT NULL DEFAULT 100,
    z_index INT NOT NULL DEFAULT 1,
    style_json JSONB DEFAULT '{}'::jsonb,
    action_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kiosk_slide_elements_slide ON kiosk_slide_elements(slide_id);

-- 9. Publicações de Apresentação em Dispositivos
CREATE TABLE IF NOT EXISTS kiosk_publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES kiosk_devices(id) ON DELETE CASCADE,
    presentation_version_id UUID NOT NULL REFERENCES kiosk_presentation_versions(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'QUEUED',
    progress_percent INT NOT NULL DEFAULT 0,
    last_error TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    downloaded_at TIMESTAMP WITH TIME ZONE,
    activated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_kiosk_pub_device ON kiosk_publications(device_id);
CREATE INDEX IF NOT EXISTS idx_kiosk_pub_status ON kiosk_publications(status);

-- 10. Eventos de Dispositivo (Heartbeat, Auditoria, Métricas)
CREATE TABLE IF NOT EXISTS kiosk_device_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES kiosk_devices(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_payload_json JSONB DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kiosk_events_device ON kiosk_device_events(device_id, occurred_at);

-- 11. Cadastro de Permissões para o Módulo de Totens
INSERT INTO permissions (id, name, description)
VALUES 
    (gen_random_uuid(), 'KIOSK_READ', 'Visualizar totens, mídias e apresentações'),
    (gen_random_uuid(), 'KIOSK_EDIT', 'Criar e editar mídias e apresentações de totens'),
    (gen_random_uuid(), 'KIOSK_PUBLISH', 'Publicar e agendar versões em totens'),
    (gen_random_uuid(), 'KIOSK_ADMIN', 'Administrar totens, pareamento e configurações')
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description;

-- 12. Associação das Permissões de Totens às Roles Administrativas e Comerciais
-- Roles Administrativas e Gestão Geral
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN (
    'SUPER_ADMIN',
    'ADMIN',
    'COMPANY_ADMIN',
    'FLEX_ADMIN',
    'GESTOR',
    'GESTOR_OPERACIONAL',
    'COMERCIAL',
    'GESTOR_COMERCIAL',
    'VENDAS',
    'CLIENT_MANAGER',
    'CLIENT_USER'
)
  AND p.name IN (
    'KIOSK_READ',
    'KIOSK_EDIT',
    'KIOSK_PUBLISH'
)
ON CONFLICT DO NOTHING;

-- Apenas Administradores recebem KIOSK_ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN (
    'SUPER_ADMIN',
    'ADMIN',
    'COMPANY_ADMIN',
    'FLEX_ADMIN'
)
  AND p.name = 'KIOSK_ADMIN'
ON CONFLICT DO NOTHING;

