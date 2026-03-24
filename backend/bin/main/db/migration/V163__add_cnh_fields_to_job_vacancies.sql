-- Migration: V283__add_cnh_fields_to_job_vacancies.sql
-- Adicionar campos de CNH na tabela job_vacancies
ALTER TABLE job_vacancies 
ADD COLUMN requires_cnh BOOLEAN DEFAULT FALSE,
ADD COLUMN cnh_category VARCHAR(10) DEFAULT NULL; 