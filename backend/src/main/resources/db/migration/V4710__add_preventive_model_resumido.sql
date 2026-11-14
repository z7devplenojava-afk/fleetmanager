-- Modelo Resumido de Preventiva (Check-List Verificação de Frota - 41 itens exatos da ficha física)

INSERT INTO checklist_itens (descricao, categoria, tipo_manutencao, vehicle_type_applicable, template_model, ordem, ativo)
SELECT v.descricao, v.categoria, 'PREVENTIVA', 'ALL', 'MODELO_RESUMIDO', v.ordem, TRUE
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

    -- C. SISTEMA DE LUBRIFICAÇÃO
    ('1. Oléo de Motor', 'C. SISTEMA DE LUBRIFICAÇÃO', 13),
    ('2. Oléo de caixa', 'C. SISTEMA DE LUBRIFICAÇÃO', 14),
    ('3. Oléo de diferencial', 'C. SISTEMA DE LUBRIFICAÇÃO', 15),
    ('4. Fluido de freio', 'C. SISTEMA DE LUBRIFICAÇÃO', 16),
    ('5. Oléo Hidráulico', 'C. SISTEMA DE LUBRIFICAÇÃO', 17),
    ('6. VAzamentos', 'C. SISTEMA DE LUBRIFICAÇÃO', 18),

    -- D. SISTEMA PNEUMÁTICO
    ('1. Vazamento de AR', 'D. SISTEMA PNEUMÁTICO', 19),
    ('2. Teste cuícas e servos', 'D. SISTEMA PNEUMÁTICO', 20),
    ('3. Estado das válvulas', 'D. SISTEMA PNEUMÁTICO', 21),
    ('4. Comprensor de ar', 'D. SISTEMA PNEUMÁTICO', 22),

    -- E. MECÂNICA GERAL
    ('1.1 Embuchamento de Molas DIANT.', 'E. MECÂNICA GERAL', 23),
    ('1.2 Embuchamento de Molas TRAS.', 'E. MECÂNICA GERAL', 24),
    ('2.1 Buchas estabilizadoras DIANT.', 'E. MECÂNICA GERAL', 25),
    ('2.2 Buchas estabilizadoras TRAS.', 'E. MECÂNICA GERAL', 26),
    ('3 Manga de eixo', 'E. MECÂNICA GERAL', 27),
    ('4 Ponteiras', 'E. MECÂNICA GERAL', 28),
    ('5.1 Lonas de freios DIANT', 'E. MECÂNICA GERAL', 29),
    ('5.2 Lonas de freios TRAS.', 'E. MECÂNICA GERAL', 30),
    ('6 Catracas', 'E. MECÂNICA GERAL', 31),
    ('7 Cardans', 'E. MECÂNICA GERAL', 32),
    ('8 Setor de direção', 'E. MECÂNICA GERAL', 33),
    ('9 Suporte do tanque', 'E. MECÂNICA GERAL', 34),
    ('10 Conferir aperto parafuso de RODA', 'E. MECÂNICA GERAL', 35),
    ('11 Correia do motor', 'E. MECÂNICA GERAL', 36),
    ('12 Rolamento da Polia de motor', 'E. MECÂNICA GERAL', 37),
    ('13 Calibragem dos Pneus', 'E. MECÂNICA GERAL', 38),
    ('14 Lubrificação', 'E. MECÂNICA GERAL', 39),

    -- F. DIVERSOS
    ('1 Aferição de Cronotacográfo', 'F. DIVERSOS', 40),
    ('2 Extintores de Incêndio', 'F. DIVERSOS', 41),
    ('3 Ar condicionado', 'F. DIVERSOS', 42),
    ('4 Puxadores dos bancos', 'F. DIVERSOS', 43),
    ('5 Cintos de segurança', 'F. DIVERSOS', 44)
) AS v(descricao, categoria, ordem)
WHERE NOT EXISTS (
    SELECT 1 FROM checklist_itens c
    WHERE c.template_model = 'MODELO_RESUMIDO'
      AND c.ordem = v.ordem
);

