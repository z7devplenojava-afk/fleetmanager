-- Backfill dos Periodos Aquisitivos a partir da data de admissao (employees.hire_date).
-- Para cada colaborador, gera um PA de 12 meses por aniversario de admissao, com:
--   data_inicio        = aniversario de admissao (indice do periodo)
--   data_fim           = data_inicio + 12 meses - 1 dia
--   limite_concessivo  = data_fim + 12 meses   (Art. 134)
--   faltas_injustificadas = faltas nao justificadas dentro do PA (tabela absences)
--   dias_direito       = tabela do Art. 130
--   dias_saldo         = dias_direito - dias ja gozados (vacations APPROVED no periodo)
-- Idempotente: nao insere PA ja existente (employee_id, data_inicio).

WITH emp AS (
    SELECT id AS employee_id, hire_date
    FROM employees
    WHERE hire_date IS NOT NULL
      AND hire_date <= CURRENT_DATE
),
series AS (
    SELECT
        e.employee_id,
        e.hire_date,
        gs AS idx
    FROM emp e
    CROSS JOIN LATERAL generate_series(
        0,
        FLOOR(EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.hire_date)))::int
    ) AS gs
),
pa AS (
    SELECT
        s.employee_id,
        (s.hire_date + (s.idx || ' years')::interval)::date AS data_inicio,
        ((s.hire_date + ((s.idx + 1) || ' years')::interval)::date - 1) AS data_fim,
        ((s.hire_date + ((s.idx + 2) || ' years')::interval)::date - 1) AS limite_concessivo
    FROM series s
),
enriquecido AS (
    SELECT
        p.employee_id,
        p.data_inicio,
        p.data_fim,
        p.limite_concessivo,
        (
            SELECT COUNT(*)
            FROM absences a
            WHERE a.employee_id = p.employee_id
              AND a.absence_date >= p.data_inicio
              AND a.absence_date <= p.data_fim
              AND a.is_justified = FALSE
        )::int AS faltas,
        (
            SELECT COALESCE(SUM(v.days_taken), 0)
            FROM vacations v
            WHERE v.employee_id = p.employee_id
              AND v.status = 'APPROVED'
              AND v.start_date >= p.data_inicio
              AND v.start_date <= p.data_fim
        )::int AS dias_gozados
    FROM pa p
),
calculado AS (
    SELECT
        e.*,
        CASE
            WHEN e.faltas <= 5  THEN 30
            WHEN e.faltas <= 14 THEN 24
            WHEN e.faltas <= 23 THEN 18
            WHEN e.faltas <= 32 THEN 12
            ELSE 0
        END AS dias_direito
    FROM enriquecido e
),
final AS (
    SELECT
        c.*,
        GREATEST(c.dias_direito - LEAST(c.dias_gozados, c.dias_direito), 0) AS dias_saldo,
        CASE
            WHEN c.data_fim >= CURRENT_DATE THEN 'EM_ANDAMENTO'
            WHEN c.limite_concessivo >= CURRENT_DATE THEN 'CONCESSIVO'
            ELSE 'EXPIRADO'
        END AS status,
        CASE
            WHEN c.dias_gozados >= c.dias_direito AND c.dias_direito > 0 THEN 'QUITADO'
            ELSE NULL
        END AS status_override
    FROM calculado c
)
INSERT INTO periodo_aquisitivo (
    id,
    employee_id,
    data_inicio,
    data_fim,
    limite_concessivo,
    dias_direito,
    dias_saldo,
    dias_utilizados,
    faltas_injustificadas,
    status,
    origem,
    resetado_por_coletiva,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    f.employee_id,
    f.data_inicio,
    f.data_fim,
    f.limite_concessivo,
    f.dias_direito,
    f.dias_saldo,
    LEAST(f.dias_gozados, f.dias_direito),
    f.faltas,
    COALESCE(f.status_override, f.status),
    'ADMISSAO',
    FALSE,
    NOW(),
    NOW()
FROM final f
WHERE NOT EXISTS (
    SELECT 1
    FROM periodo_aquisitivo p
    WHERE p.employee_id = f.employee_id
      AND p.data_inicio = f.data_inicio
);
