-- Migration: V4608__add_title_to_cipa_meetings.sql
-- Description: Adiciona coluna title na tabela cipa_meetings (usada pela página CIPA do frontend)

-- 1. Adicionar coluna title (nullable primeiro, para popular registros existentes)
ALTER TABLE cipa_meetings
    ADD COLUMN IF NOT EXISTS title VARCHAR(255);

-- 2. Popular registros existentes com título padrão baseado na data
UPDATE cipa_meetings
SET title = 'Reunião CIPA - ' || TO_CHAR(meeting_date, 'DD/MM/YYYY')
WHERE title IS NULL;

-- 3. Tornar NOT NULL
ALTER TABLE cipa_meetings
    ALTER COLUMN title SET NOT NULL;
