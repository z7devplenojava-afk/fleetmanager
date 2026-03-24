-- Script para verificar holerites processados na tabela payslips

-- 1. Contar total de holerites processados
SELECT COUNT(*) as total_holerites FROM payslips;

-- 2. Ver os últimos holerites processados
SELECT 
    id,
    employee_name,
    cpf,
    month,
    year,
    file_name,
    arquivo_caminho,
    processed_at
FROM payslips
ORDER BY processed_at DESC
LIMIT 10;

-- 3. Verificar holerites por período
SELECT 
    year,
    month,
    COUNT(*) as quantidade
FROM payslips
GROUP BY year, month
ORDER BY year DESC, month DESC;

-- 4. Verificar se há holerites sem arquivo_caminho
SELECT 
    COUNT(*) as sem_caminho
FROM payslips
WHERE arquivo_caminho IS NULL OR arquivo_caminho = '';

-- 5. Verificar DocumentPages processadas (tabela intermediária)
SELECT 
    COUNT(*) as total_pages,
    COUNT(DISTINCT job_id) as total_jobs,
    COUNT(CASE WHEN type = 'HOLERITE' THEN 1 END) as holerites,
    COUNT(CASE WHEN type = 'COMPROVANTE' THEN 1 END) as comprovantes
FROM document_page;

-- 6. Verificar jobs de processamento
SELECT 
    id,
    file_name,
    document_type,
    status,
    total_pages,
    processed_pages,
    created_at,
    completed_at
FROM document_processing_jobs
ORDER BY created_at DESC
LIMIT 10;

