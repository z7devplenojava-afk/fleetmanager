-- Migration: V282__add_missing_columns_to_job_candidates.sql
-- Adicionar colunas faltantes na tabela job_candidates

-- Adicionar coluna requires_cnh
ALTER TABLE job_candidates ADD COLUMN requires_cnh BOOLEAN;

-- Adicionar coluna cnh_category
ALTER TABLE job_candidates ADD COLUMN cnh_category VARCHAR(10);

-- Adicionar coluna curriculum_url
ALTER TABLE job_candidates ADD COLUMN curriculum_url VARCHAR(500); 