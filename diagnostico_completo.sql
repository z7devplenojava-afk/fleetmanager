-- DIAGNÓSTICO COMPLETO DO PROCESSAMENTO DE HOLERITES

-- 1. Verificar se há jobs de processamento
SELECT 
    id,
    file_name,
    document_type,
    status,
    total_pages,
    processed_pages,
    progress_percentage,
    created_at,
    started_at,
    completed_at,
    error_message
FROM document_processing_jobs
ORDER BY created_at DESC
LIMIT 20;

-- 2. Verificar se há DocumentPages criadas
SELECT 
    COUNT(*) as total_pages,
    COUNT(DISTINCT job_id) as total_jobs,
    COUNT(CASE WHEN type = 'HOLERITE' THEN 1 END) as holerites,
    COUNT(CASE WHEN type = 'COMPROVANTE' THEN 1 END) as comprovantes,
    COUNT(CASE WHEN status = 'OK' THEN 1 END) as status_ok,
    COUNT(CASE WHEN status = 'REVIEW' THEN 1 END) as status_review,
    COUNT(CASE WHEN status = 'ERROR' THEN 1 END) as status_error
FROM document_page;

-- 3. Ver detalhes das DocumentPages
SELECT 
    id,
    job_id,
    type,
    status,
    cpf,
    name,
    period,
    page_number,
    processed_at
FROM document_page
ORDER BY processed_at DESC
LIMIT 20;

-- 4. Verificar se há payslips salvos
SELECT COUNT(*) as total_payslips FROM payslips;

-- 5. Verificar se há payment_receipts salvos
SELECT COUNT(*) as total_receipts FROM payment_receipts;

-- 6. Verificar jobs que foram completados mas não geraram payslips
SELECT 
    j.id,
    j.file_name,
    j.document_type,
    j.status,
    j.total_pages,
    j.processed_pages,
    COUNT(dp.id) as pages_criadas,
    COUNT(CASE WHEN dp.type = 'HOLERITE' THEN 1 END) as holerites_pages,
    COUNT(CASE WHEN dp.status = 'OK' THEN 1 END) as pages_ok
FROM document_processing_jobs j
LEFT JOIN document_page dp ON dp.job_id = j.id
WHERE j.status = 'COMPLETED'
GROUP BY j.id, j.file_name, j.document_type, j.status, j.total_pages, j.processed_pages
ORDER BY j.created_at DESC;

