-- Modelo 2 de OS Preventiva Automático (Check-List Verificação de Frota + Plano Urbano/Rodoviário + Alternador 150.000 km)

ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS preventive_model VARCHAR(30) DEFAULT 'MODELO_1';
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS operation_profile VARCHAR(20) DEFAULT 'URBANO';
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS triggered_items_summary TEXT;

ALTER TABLE checklist_itens ADD COLUMN IF NOT EXISTS template_model VARCHAR(30) NOT NULL DEFAULT 'MODELO_1';
CREATE INDEX IF NOT EXISTS idx_checklist_itens_template_model ON checklist_itens(template_model, ativo, ordem);

ALTER TABLE fleet_component_control_configs ADD COLUMN IF NOT EXISTS alternator_quick_check_interval_km INTEGER NOT NULL DEFAULT 15000;
ALTER TABLE fleet_component_control_configs ADD COLUMN IF NOT EXISTS auto_open_preventive_os BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE fleet_component_control_configs ADD COLUMN IF NOT EXISTS default_preventive_model VARCHAR(30) NOT NULL DEFAULT 'MODELO_2';

-- Seed idempotente do Checklist Modelo 2 (baseado na ficha Check-List Verificação de Frota + tabela preventiva Urbano/Rodoviário + Alternador 150.000 km)
INSERT INTO checklist_itens (descricao, categoria, tipo_manutencao, vehicle_type_applicable, template_model, ordem, ativo)
SELECT v.descricao, v.categoria, 'PREVENTIVA', 'ALL', 'MODELO_2', v.ordem, TRUE
FROM (VALUES
    -- A. VISUAL (INTERNO / EXTERNO)
    ('1. Pintura', 'A. VISUAL (INTERNO / EXTERNO)', 1),
    ('2. Rodas', 'A. VISUAL (INTERNO / EXTERNO)', 2),
    ('3. Limpeza Externa', 'A. VISUAL (INTERNO / EXTERNO)', 3),
    ('4. Limpeza Interna', 'A. VISUAL (INTERNO / EXTERNO)', 4),
    ('5. Pneus', 'A. VISUAL (INTERNO / EXTERNO)', 5),

    -- B. SISTEMA ELÉTRICO
    ('1. Iluminação interna', 'B. SISTEMA ELÉTRICO', 6),
    ('2. Iluminação externa', 'B. SISTEMA ELÉTRICO', 7),
    ('3. Sirene de ré', 'B. SISTEMA ELÉTRICO', 8),
    ('4. Buzina', 'B. SISTEMA ELÉTRICO', 9),
    ('5. Limpadores de para-brisa', 'B. SISTEMA ELÉTRICO', 10),
    ('6. Painel de instrumentos', 'B. SISTEMA ELÉTRICO', 11),
    ('7. Bateria', 'B. SISTEMA ELÉTRICO', 12),
    ('8. Alternador (Inspeção elétrica rápida - 15.000 km: medição de carga, escovas e tensão de correia)', 'B. SISTEMA ELÉTRICO', 13),
    ('9. Alternador (Revisão Geral / Troca ou Recondicionamento em Bancada - 150.000 km: rolamentos internos, anéis coletores, retífica do rotor, diodos e regulador de voltagem)', 'B. SISTEMA ELÉTRICO', 14),
    ('10. Motor de Arranque (Revisão - 20.000 km: inspeção visual, limpeza do coletor, checagem de escovas e teste de solenoide)', 'B. SISTEMA ELÉTRICO', 15),

    -- C. SISTEMA DE LUBRIFICAÇÃO
    ('1. Óleo de Motor + Filtro de óleo (troca simultânea obrigatória: 10-15k Urbano / 20-40k Rodoviário)', 'C. SISTEMA DE LUBRIFICAÇÃO', 16),
    ('2. Óleo de caixa (câmbio e diferencial: 60-80k Urbano / 80-120k Rodoviário)', 'C. SISTEMA DE LUBRIFICAÇÃO', 17),
    ('3. Óleo de diferencial (verificar nível a cada revisão preventiva)', 'C. SISTEMA DE LUBRIFICAÇÃO', 18),
    ('4. Fluido de freio', 'C. SISTEMA DE LUBRIFICAÇÃO', 19),
    ('5. Óleo Hidráulico', 'C. SISTEMA DE LUBRIFICAÇÃO', 20),
    ('6. Vazamentos', 'C. SISTEMA DE LUBRIFICAÇÃO', 21),
    ('7. Filtro de combustível / separador d''água (10-15k Urbano / 20-30k Rodoviário — drenar bacia diariamente)', 'C. SISTEMA DE LUBRIFICAÇÃO', 22),

    -- D. SISTEMA PNEUMÁTICO
    ('1. Vazamento de AR', 'D. SISTEMA PNEUMÁTICO', 23),
    ('2. Teste cuícas e servos', 'D. SISTEMA PNEUMÁTICO', 24),
    ('3. Estado das válvulas', 'D. SISTEMA PNEUMÁTICO', 25),
    ('4. Compressor de ar', 'D. SISTEMA PNEUMÁTICO', 26),
    ('5. Filtro secador de ar (APU) (50-60k Urbano / 60-80k Rodoviário)', 'D. SISTEMA PNEUMÁTICO', 27),

    -- E. MECÂNICA GERAL
    ('1.1 Embuchamento de Molas DIANT.', 'E. MECÂNICA GERAL', 28),
    ('1.2 Embuchamento de Molas TRAS.', 'E. MECÂNICA GERAL', 29),
    ('2.1 Buchas estabilizadoras DIANT.', 'E. MECÂNICA GERAL', 30),
    ('2.2 Buchas estabilizadoras TRAS.', 'E. MECÂNICA GERAL', 31),
    ('3. Manga de eixo', 'E. MECÂNICA GERAL', 32),
    ('4. Ponteiras', 'E. MECÂNICA GERAL', 33),
    ('5.1 Lonas / Pastilhas de freios DIANT. (30-50k Urbano / 60-100k Rodoviário)', 'E. MECÂNICA GERAL', 34),
    ('5.2 Lonas / Pastilhas de freios TRAS. (verificar regulagem e espessura)', 'E. MECÂNICA GERAL', 35),
    ('6. Catracas', 'E. MECÂNICA GERAL', 36),
    ('7. Cardans', 'E. MECÂNICA GERAL', 37),
    ('8. Setor de direção', 'E. MECÂNICA GERAL', 38),
    ('9. Suporte do tanque', 'E. MECÂNICA GERAL', 39),
    ('10. Conferir aperto parafuso de RODA', 'E. MECÂNICA GERAL', 40),
    ('11. Correia do motor', 'E. MECÂNICA GERAL', 41),
    ('12. Rolamento da Polia de motor (Guia/Esticador - 20.000 km: folga radial/axial, ruído e lubrificação)', 'E. MECÂNICA GERAL', 42),
    ('13. Calibragem dos Pneus', 'E. MECÂNICA GERAL', 43),
    ('14. Lubrificação', 'E. MECÂNICA GERAL', 44),
    ('15. Alinhamento e Balanceamento (20.000 km — checar folgas de barra de direção e terminais)', 'E. MECÂNICA GERAL', 45),
    ('16. Filtro de ar do motor (20-30k Urbano / 30-40k Rodoviário — trocar antes se vacuômetro indicar restrição)', 'E. MECÂNICA GERAL', 46),
    ('17. Líquido de arrefecimento (80k Urbano / 100k Rodoviário — aditivo desmineralizado)', 'E. MECÂNICA GERAL', 47),
    ('18. Cubos de roda (graxa, vedadores e pré-carga dos rolamentos: 80-90k Urbano / 90-100k Rodoviário)', 'E. MECÂNICA GERAL', 48),
    ('19. Embreagem (disco e platô: 80-120k Urbano / 150-250k Rodoviário; regulagem pedal/atuador a cada 20k)', 'E. MECÂNICA GERAL', 49),

    -- F. DIVERSOS
    ('1. Aferição de Cronotacógrafo', 'F. DIVERSOS', 50),
    ('2. Extintores de Incêndio', 'F. DIVERSOS', 51),
    ('3. Ar condicionado', 'F. DIVERSOS', 52),
    ('4. Puxadores dos bancos', 'F. DIVERSOS', 53),
    ('5. Cintos de segurança', 'F. DIVERSOS', 54)
) AS v(descricao, categoria, ordem)
WHERE NOT EXISTS (
    SELECT 1 FROM checklist_itens c
    WHERE c.company_id IS NULL
      AND c.template_model = 'MODELO_2'
      AND c.ordem = v.ordem
);

