-- Migration: V409__fix_work_post_types.sql
-- Description: Fix work post types to match Java enum values

-- Primeiro, vamos ver quais tipos existem no banco
-- SELECT DISTINCT type FROM work_posts ORDER BY type;

-- Atualizar tipos de posto para valores válidos do enum do banco
UPDATE work_posts 
SET type = 'POSTO_8H_DIURNO' 
WHERE type = 'POSTO_8H_DIURNO';

UPDATE work_posts 
SET type = 'POSTO_8H_NOTURNO' 
WHERE type = 'POSTO_8H_NOTURNO';

UPDATE work_posts 
SET type = 'POSTO_12H_DIURNO' 
WHERE type = 'POSTO_12H_DIURNO';

UPDATE work_posts 
SET type = 'POSTO_12H_NOTURNO' 
WHERE type = 'POSTO_12H_NOTURNO';

UPDATE work_posts 
SET type = 'POSTO_24H' 
WHERE type = 'POSTO_24H';

UPDATE work_posts 
SET type = 'POSTO_SDF' 
WHERE type = 'POSTO_SDF';

UPDATE work_posts 
SET type = 'POSTO_ESPECIAL' 
WHERE type = 'POSTO_ESPECIAL';

-- Se algum tipo não for reconhecido, definir como POSTO_24H (padrão)
UPDATE work_posts 
SET type = 'POSTO_24H' 
WHERE type NOT IN (
    'POSTO_24H', 'POSTO_12H_DIURNO', 'POSTO_12H_NOTURNO', 
    'POSTO_8H_DIURNO', 'POSTO_8H_NOTURNO', 'POSTO_SDF', 'POSTO_ESPECIAL'
);

-- Verificar se há algum tipo inválido restante
-- SELECT DISTINCT type FROM work_posts ORDER BY type;
